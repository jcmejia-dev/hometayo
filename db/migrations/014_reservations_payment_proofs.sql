-- Transaction workflow: approved rental requests become time-limited payment holds,
-- then reserved tenancies after owner-confirmed proof. Monthly rent can also be
-- submitted by renters and confirmed by owners without HomeTayo holding funds.

ALTER TABLE rental_tenancies DROP CONSTRAINT IF EXISTS rental_tenancies_status_check;
ALTER TABLE rental_tenancies ADD CONSTRAINT rental_tenancies_status_check
 CHECK(status IN ('invited','reserved','active','ending','ended','declined'));

DROP INDEX IF EXISTS rental_tenancies_thread_live_idx;
CREATE UNIQUE INDEX rental_tenancies_thread_live_idx
 ON rental_tenancies(conversation_id) WHERE status IN ('invited','reserved','active','ending');

ALTER TABLE rent_charges ADD COLUMN IF NOT EXISTS charge_kind text NOT NULL DEFAULT 'rent';
ALTER TABLE rent_charges DROP CONSTRAINT IF EXISTS rent_charges_kind_check;
ALTER TABLE rent_charges ADD CONSTRAINT rent_charges_kind_check CHECK(charge_kind IN ('rent','deposit','other'));
CREATE INDEX IF NOT EXISTS rent_charges_kind_idx ON rent_charges(tenancy_id,charge_kind,due_on) WHERE voided_at IS NULL;

CREATE TABLE rental_reservations (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 request_id uuid NOT NULL UNIQUE REFERENCES rental_requests(id) ON DELETE CASCADE,
 conversation_id uuid NOT NULL REFERENCES rental_conversations(id) ON DELETE CASCADE,
 unit_id uuid NOT NULL REFERENCES rental_units(id) ON DELETE CASCADE,
 renter_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 owner_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 tenancy_id uuid UNIQUE REFERENCES rental_tenancies(id) ON DELETE SET NULL,
 status text NOT NULL DEFAULT 'awaiting_payment' CHECK(status IN ('awaiting_payment','proof_submitted','reserved','expired','cancelled','converted')),
 amount_centavos integer NOT NULL DEFAULT 0 CHECK(amount_centavos BETWEEN 0 AND 500000000),
 credit_target text NOT NULL DEFAULT 'none' CHECK(credit_target IN ('none','first_rent','deposit')),
 monthly_rent_centavos integer NOT NULL CHECK(monthly_rent_centavos BETWEEN 100 AND 500000000),
 security_deposit_centavos integer NOT NULL DEFAULT 0 CHECK(security_deposit_centavos BETWEEN 0 AND 500000000),
 starts_on date NOT NULL,
 move_in_on date NOT NULL,
 lease_ends_on date,
 payment_method text CHECK(payment_method IS NULL OR payment_method IN ('gcash','maya','bank','cash','other')),
 proof_url text,
 payment_reference text NOT NULL DEFAULT '' CHECK(char_length(payment_reference)<=120),
 owner_note text NOT NULL DEFAULT '' CHECK(char_length(owner_note)<=500),
 expires_at timestamptz NOT NULL,
 submitted_at timestamptz,
 confirmed_at timestamptz,
 cancelled_at timestamptz,
 created_at timestamptz NOT NULL DEFAULT now(),
 CHECK(owner_id<>renter_id),
 CHECK(lease_ends_on IS NULL OR lease_ends_on>=starts_on),
 CHECK(move_in_on>=starts_on),
 CHECK(proof_url IS NULL OR proof_url ~ '^https://'),
 CHECK((credit_target<>'first_rent' OR amount_centavos<=monthly_rent_centavos)
   AND (credit_target<>'deposit' OR amount_centavos<=security_deposit_centavos))
);
CREATE INDEX rental_reservations_thread_idx ON rental_reservations(conversation_id,created_at DESC);
CREATE INDEX rental_reservations_expiry_idx ON rental_reservations(expires_at) WHERE status='awaiting_payment';
CREATE INDEX rental_reservations_unit_live_idx ON rental_reservations(unit_id,status) WHERE status IN ('awaiting_payment','proof_submitted');

CREATE TABLE rent_payment_submissions (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 charge_id uuid NOT NULL REFERENCES rent_charges(id) ON DELETE CASCADE,
 renter_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 amount_centavos integer NOT NULL CHECK(amount_centavos BETWEEN 1 AND 500000000),
 paid_on date NOT NULL,
 payment_method text NOT NULL CHECK(payment_method IN ('gcash','maya','bank','cash','other')),
 proof_url text,
 payment_reference text NOT NULL DEFAULT '' CHECK(char_length(payment_reference)<=120),
 note text NOT NULL DEFAULT '' CHECK(char_length(note)<=250),
 status text NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','confirmed','rejected','cancelled')),
 payment_id uuid UNIQUE REFERENCES rent_payments(id) ON DELETE SET NULL,
 reviewed_by text REFERENCES users(id) ON DELETE SET NULL,
 reviewed_at timestamptz,
 rejection_reason text CHECK(rejection_reason IS NULL OR char_length(rejection_reason)<=250),
 created_at timestamptz NOT NULL DEFAULT now(),
 CHECK(proof_url IS NULL OR proof_url ~ '^https://'),
 CHECK(payment_method='cash' OR proof_url IS NOT NULL)
);
CREATE UNIQUE INDEX rent_payment_submissions_pending_idx ON rent_payment_submissions(charge_id,renter_id) WHERE status='pending';
CREATE INDEX rent_payment_submissions_charge_idx ON rent_payment_submissions(charge_id,created_at DESC);

CREATE TABLE owner_payment_profiles (
 owner_id text PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
 gcash_name text NOT NULL DEFAULT '' CHECK(char_length(gcash_name)<=120),
 gcash_number text NOT NULL DEFAULT '' CHECK(char_length(gcash_number)<=32),
 maya_name text NOT NULL DEFAULT '' CHECK(char_length(maya_name)<=120),
 maya_number text NOT NULL DEFAULT '' CHECK(char_length(maya_number)<=32),
 bank_label text NOT NULL DEFAULT '' CHECK(char_length(bank_label)<=120),
 bank_account_name text NOT NULL DEFAULT '' CHECK(char_length(bank_account_name)<=120),
 bank_account_number text NOT NULL DEFAULT '' CHECK(char_length(bank_account_number)<=80),
 accepts_cash boolean NOT NULL DEFAULT false,
 updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE rental_notifications DROP CONSTRAINT IF EXISTS rental_notifications_kind_check;
ALTER TABLE rental_notifications ADD CONSTRAINT rental_notifications_kind_check CHECK(kind IN (
 'inquiry','message','tenancy','payment','reminder','reaction','safety',
 'rental_request','reservation','payment_proof','maintenance','document','review'
));

-- Holds awaiting payment consume capacity so an owner cannot approve more renters
-- than a room can accept. Once converted to a tenancy, tenancy_id is populated and
-- the tenancy itself becomes the capacity source.
CREATE OR REPLACE FUNCTION enforce_reservation_capacity() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE max_capacity integer; live_count integer; hold_count integer;
BEGIN
 IF NEW.status NOT IN ('awaiting_payment','proof_submitted') OR NEW.tenancy_id IS NOT NULL THEN RETURN NEW; END IF;
 SELECT capacity INTO max_capacity FROM rental_units WHERE id=NEW.unit_id FOR UPDATE;
 SELECT count(*) INTO live_count FROM rental_tenancies
  WHERE unit_id=NEW.unit_id AND status IN ('invited','reserved','active','ending');
 SELECT count(*) INTO hold_count FROM rental_reservations
  WHERE unit_id=NEW.unit_id AND status IN ('awaiting_payment','proof_submitted') AND tenancy_id IS NULL AND id<>NEW.id;
 IF live_count+hold_count>=max_capacity THEN RAISE EXCEPTION 'This unit is already at capacity'; END IF;
 RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS rental_reservation_capacity_guard ON rental_reservations;
CREATE TRIGGER rental_reservation_capacity_guard BEFORE INSERT OR UPDATE OF unit_id,status,tenancy_id
 ON rental_reservations FOR EACH ROW EXECUTE FUNCTION enforce_reservation_capacity();

CREATE OR REPLACE FUNCTION enforce_rental_unit_capacity() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE max_capacity integer; live_count integer; hold_count integer;
BEGIN
 IF NEW.status NOT IN ('invited','reserved','active','ending') THEN RETURN NEW; END IF;
 SELECT capacity INTO max_capacity FROM rental_units WHERE id=NEW.unit_id FOR UPDATE;
 SELECT count(*) INTO live_count FROM rental_tenancies
  WHERE unit_id=NEW.unit_id AND status IN ('invited','reserved','active','ending') AND id<>NEW.id;
 SELECT count(*) INTO hold_count FROM rental_reservations
  WHERE unit_id=NEW.unit_id AND status IN ('awaiting_payment','proof_submitted') AND tenancy_id IS NULL;
 IF live_count+hold_count>=max_capacity THEN RAISE EXCEPTION 'This unit is already at capacity'; END IF;
 RETURN NEW;
END $$;

CREATE OR REPLACE FUNCTION sync_rental_unit_from_tenancies() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE target uuid; active_count integer; reserved_count integer; hold_count integer;
BEGIN
 target=CASE WHEN TG_OP='DELETE' THEN OLD.unit_id ELSE NEW.unit_id END;
 SELECT count(*) FILTER (WHERE status IN ('active','ending')),
        count(*) FILTER (WHERE status IN ('invited','reserved'))
 INTO active_count,reserved_count FROM rental_tenancies WHERE unit_id=target;
 SELECT count(*) INTO hold_count FROM rental_reservations
  WHERE unit_id=target AND status IN ('awaiting_payment','proof_submitted') AND tenancy_id IS NULL;
 UPDATE rental_units SET status=CASE
   WHEN active_count>0 THEN 'occupied'
   WHEN reserved_count>0 OR hold_count>0 THEN 'reserved'
   ELSE 'available'
  END,updated_at=now()
 WHERE id=target AND status<>'unavailable';
 RETURN CASE WHEN TG_OP='DELETE' THEN OLD ELSE NEW END;
END $$;

CREATE OR REPLACE FUNCTION sync_rental_unit_from_reservations() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE target uuid;
BEGIN
 target=CASE WHEN TG_OP='DELETE' THEN OLD.unit_id ELSE NEW.unit_id END;
 PERFORM sync_rental_unit_for_id(target);
 RETURN CASE WHEN TG_OP='DELETE' THEN OLD ELSE NEW END;
END $$;

-- PostgreSQL functions cannot directly call a trigger function, so keep the common
-- reservation-trigger calculation in a normal helper.
CREATE OR REPLACE FUNCTION sync_rental_unit_for_id(target uuid) RETURNS void LANGUAGE plpgsql AS $$
DECLARE active_count integer; reserved_count integer; hold_count integer;
BEGIN
 SELECT count(*) FILTER (WHERE status IN ('active','ending')),
        count(*) FILTER (WHERE status IN ('invited','reserved'))
 INTO active_count,reserved_count FROM rental_tenancies WHERE unit_id=target;
 SELECT count(*) INTO hold_count FROM rental_reservations
  WHERE unit_id=target AND status IN ('awaiting_payment','proof_submitted') AND tenancy_id IS NULL;
 UPDATE rental_units SET status=CASE
   WHEN active_count>0 THEN 'occupied'
   WHEN reserved_count>0 OR hold_count>0 THEN 'reserved'
   ELSE 'available'
  END,updated_at=now()
 WHERE id=target AND status<>'unavailable';
END $$;

-- Replace the reservation trigger function now that the helper exists.
CREATE OR REPLACE FUNCTION sync_rental_unit_from_reservations() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE target uuid;
BEGIN
 target=CASE WHEN TG_OP='DELETE' THEN OLD.unit_id ELSE NEW.unit_id END;
 PERFORM sync_rental_unit_for_id(target);
 RETURN CASE WHEN TG_OP='DELETE' THEN OLD ELSE NEW END;
END $$;
DROP TRIGGER IF EXISTS rental_reservation_unit_sync ON rental_reservations;
CREATE TRIGGER rental_reservation_unit_sync AFTER INSERT OR UPDATE OF status,unit_id,tenancy_id OR DELETE
 ON rental_reservations FOR EACH ROW EXECUTE FUNCTION sync_rental_unit_from_reservations();

CREATE OR REPLACE FUNCTION protect_tenanted_unit() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 IF EXISTS(SELECT 1 FROM rental_tenancies WHERE unit_id=NEW.id
   AND ((status IN ('active','ending') AND NEW.status<>'occupied') OR (status IN ('invited','reserved') AND NEW.status<>'reserved')))
   OR EXISTS(SELECT 1 FROM rental_reservations WHERE unit_id=NEW.id AND tenancy_id IS NULL AND status IN ('awaiting_payment','proof_submitted') AND NEW.status<>'reserved') THEN
   RAISE EXCEPTION 'End, decline, cancel, or expire the rental commitment before changing unit availability';
 END IF;
 RETURN NEW;
END $$;
