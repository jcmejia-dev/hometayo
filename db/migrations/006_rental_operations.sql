CREATE TABLE rental_conversations (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 listing_id uuid NOT NULL REFERENCES listings(id),
 owner_id text NOT NULL REFERENCES users(id),
 renter_id text NOT NULL REFERENCES users(id),
 created_at timestamptz NOT NULL DEFAULT now(),
 CHECK(owner_id<>renter_id), UNIQUE(listing_id,renter_id)
);
CREATE INDEX rental_conversations_owner_idx ON rental_conversations(owner_id);
CREATE INDEX rental_conversations_renter_idx ON rental_conversations(renter_id);
CREATE TABLE rental_messages (
 id uuid PRIMARY KEY,
 conversation_id uuid NOT NULL REFERENCES rental_conversations(id),
 sender_id text NOT NULL REFERENCES users(id),
 body text NOT NULL CHECK(char_length(body) BETWEEN 1 AND 2000),
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX rental_messages_thread_idx ON rental_messages(conversation_id,created_at);
CREATE TABLE rental_notifications (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 user_id text NOT NULL REFERENCES users(id),
 conversation_id uuid NOT NULL REFERENCES rental_conversations(id),
 kind text NOT NULL CHECK(kind IN ('inquiry','message','tenancy','payment','reminder')),
 body text NOT NULL,
 event_key text NOT NULL UNIQUE,
 read_at timestamptz,
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX rental_notifications_user_idx ON rental_notifications(user_id,created_at);
CREATE TABLE rental_tenancies (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 conversation_id uuid NOT NULL REFERENCES rental_conversations(id),
 unit_id uuid NOT NULL REFERENCES rental_units(id),
 status text NOT NULL DEFAULT 'invited' CHECK(status IN ('invited','active','ended','declined')),
 monthly_rent_centavos integer NOT NULL CHECK(monthly_rent_centavos BETWEEN 100 AND 500000000),
 starts_on date NOT NULL,
 ended_on date,
 created_at timestamptz NOT NULL DEFAULT now(),
 CHECK(ended_on IS NULL OR ended_on>=starts_on)
);
CREATE UNIQUE INDEX rental_tenancies_unit_live_idx ON rental_tenancies(unit_id) WHERE status IN ('invited','active');
CREATE UNIQUE INDEX rental_tenancies_thread_live_idx ON rental_tenancies(conversation_id) WHERE status IN ('invited','active');
CREATE TABLE rent_charges (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 tenancy_id uuid NOT NULL REFERENCES rental_tenancies(id),
 due_on date NOT NULL,
 description text NOT NULL CHECK(char_length(description) BETWEEN 1 AND 120),
 amount_centavos integer NOT NULL CHECK(amount_centavos BETWEEN 100 AND 500000000),
 voided_at timestamptz,
 void_reason text CHECK(char_length(void_reason) BETWEEN 1 AND 250),
 created_at timestamptz NOT NULL DEFAULT now(),
 CHECK((voided_at IS NULL)=(void_reason IS NULL))
);
CREATE UNIQUE INDEX rent_charges_active_period_idx ON rent_charges(tenancy_id,due_on,description) WHERE voided_at IS NULL;
CREATE INDEX rent_charges_tenancy_idx ON rent_charges(tenancy_id);
CREATE TABLE rent_payments (
 id uuid PRIMARY KEY,
 charge_id uuid NOT NULL REFERENCES rent_charges(id),
 amount_centavos integer NOT NULL CHECK(amount_centavos BETWEEN 1 AND 500000000),
 paid_on date NOT NULL,
 note text NOT NULL DEFAULT '' CHECK(char_length(note)<=250),
 recorded_by text NOT NULL REFERENCES users(id),
 voided_at timestamptz,
 void_reason text CHECK(char_length(void_reason) BETWEEN 1 AND 250),
 created_at timestamptz NOT NULL DEFAULT now(),
 CHECK((voided_at IS NULL)=(void_reason IS NULL))
);
CREATE INDEX rent_payments_charge_idx ON rent_payments(charge_id);
-- Serialize payment entry and charge corrections on the charge row.
CREATE FUNCTION protect_payment_charge() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE cancelled timestamptz;
BEGIN
 SELECT voided_at INTO cancelled FROM rent_charges WHERE id=NEW.charge_id FOR UPDATE;
 IF cancelled IS NOT NULL THEN RAISE EXCEPTION 'Cannot pay a voided charge'; END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER rental_payment_charge_guard BEFORE INSERT ON rent_payments FOR EACH ROW EXECUTE FUNCTION protect_payment_charge();
CREATE FUNCTION protect_charge_void() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 IF NEW.voided_at IS NOT NULL AND OLD.voided_at IS NULL AND EXISTS(SELECT 1 FROM rent_payments WHERE charge_id=NEW.id AND voided_at IS NULL) THEN
  RAISE EXCEPTION 'Void recorded payments before voiding the charge';
 END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER rental_charge_void_guard BEFORE UPDATE ON rent_charges FOR EACH ROW EXECUTE FUNCTION protect_charge_void();
CREATE TABLE listing_reactions (
 listing_id uuid NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
 user_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 kind text NOT NULL CHECK(kind IN ('like','love','interested')),
 PRIMARY KEY(listing_id,user_id)
);
-- A tenancy is the source of occupancy. Owners cannot accidentally reopen its unit.
CREATE FUNCTION protect_tenanted_unit() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 IF EXISTS(SELECT 1 FROM rental_tenancies WHERE unit_id=NEW.id
   AND ((status='active' AND NEW.status<>'occupied') OR (status='invited' AND NEW.status<>'reserved'))) THEN
   RAISE EXCEPTION 'End or decline the tenancy before changing unit availability';
 END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER rental_unit_tenancy_guard BEFORE UPDATE ON rental_units FOR EACH ROW EXECUTE FUNCTION protect_tenanted_unit();
