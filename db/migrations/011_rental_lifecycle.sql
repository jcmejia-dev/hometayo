-- Complete rental lifecycle: requests, richer tenancy terms, maintenance, documents,
-- post-tenancy reviews, capacity protection, and push-delivery bookkeeping.
-- This migration is additive and preserves all existing rental history.

ALTER TABLE rental_units ADD COLUMN IF NOT EXISTS capacity integer NOT NULL DEFAULT 1;
ALTER TABLE rental_units DROP CONSTRAINT IF EXISTS rental_units_capacity_check;
ALTER TABLE rental_units ADD CONSTRAINT rental_units_capacity_check CHECK(capacity BETWEEN 1 AND 20);

ALTER TABLE rental_tenancies ADD COLUMN IF NOT EXISTS security_deposit_centavos integer NOT NULL DEFAULT 0;
ALTER TABLE rental_tenancies ADD COLUMN IF NOT EXISTS lease_ends_on date;
ALTER TABLE rental_tenancies ADD COLUMN IF NOT EXISTS move_in_on date;
ALTER TABLE rental_tenancies ADD COLUMN IF NOT EXISTS ending_on date;
ALTER TABLE rental_tenancies ADD COLUMN IF NOT EXISTS approved_at timestamptz;
UPDATE rental_tenancies SET move_in_on=starts_on WHERE move_in_on IS NULL AND status IN ('active','ended');
ALTER TABLE rental_tenancies DROP CONSTRAINT IF EXISTS rental_tenancies_status_check;
ALTER TABLE rental_tenancies ADD CONSTRAINT rental_tenancies_status_check
 CHECK(status IN ('invited','active','ending','ended','declined'));
ALTER TABLE rental_tenancies DROP CONSTRAINT IF EXISTS rental_tenancies_terms_check;
ALTER TABLE rental_tenancies ADD CONSTRAINT rental_tenancies_terms_check CHECK(
 security_deposit_centavos BETWEEN 0 AND 500000000
 AND (lease_ends_on IS NULL OR lease_ends_on>=starts_on)
 AND (move_in_on IS NULL OR move_in_on>=starts_on)
 AND (ending_on IS NULL OR ending_on>=starts_on)
);

DROP INDEX IF EXISTS rental_tenancies_unit_live_idx;
DROP INDEX IF EXISTS rental_tenancies_thread_live_idx;
CREATE UNIQUE INDEX IF NOT EXISTS rental_tenancies_thread_live_idx
 ON rental_tenancies(conversation_id) WHERE status IN ('invited','active','ending');

CREATE OR REPLACE FUNCTION enforce_rental_unit_capacity() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE max_capacity integer; live_count integer;
BEGIN
 IF NEW.status NOT IN ('invited','active','ending') THEN RETURN NEW; END IF;
 SELECT capacity INTO max_capacity FROM rental_units WHERE id=NEW.unit_id FOR UPDATE;
 SELECT count(*) INTO live_count FROM rental_tenancies
  WHERE unit_id=NEW.unit_id AND status IN ('invited','active','ending') AND id<>NEW.id;
 IF live_count>=max_capacity THEN RAISE EXCEPTION 'This unit is already at capacity'; END IF;
 RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS rental_tenancy_capacity_guard ON rental_tenancies;
CREATE TRIGGER rental_tenancy_capacity_guard BEFORE INSERT OR UPDATE OF unit_id,status
 ON rental_tenancies FOR EACH ROW EXECUTE FUNCTION enforce_rental_unit_capacity();

CREATE OR REPLACE FUNCTION sync_rental_unit_from_tenancies() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE target uuid; active_count integer; pending_count integer;
BEGIN
 target=COALESCE(NEW.unit_id,OLD.unit_id);
 SELECT count(*) FILTER (WHERE status IN ('active','ending')),
        count(*) FILTER (WHERE status='invited')
 INTO active_count,pending_count FROM rental_tenancies WHERE unit_id=target;
 UPDATE rental_units SET status=CASE
   WHEN active_count>0 THEN 'occupied'
   WHEN pending_count>0 THEN 'reserved'
   ELSE 'available'
  END,updated_at=now()
 WHERE id=target AND status<>'unavailable';
 RETURN COALESCE(NEW,OLD);
END $$;
DROP TRIGGER IF EXISTS rental_tenancy_unit_sync ON rental_tenancies;
CREATE TRIGGER rental_tenancy_unit_sync AFTER INSERT OR UPDATE OF status,unit_id OR DELETE
 ON rental_tenancies FOR EACH ROW EXECUTE FUNCTION sync_rental_unit_from_tenancies();

CREATE TABLE IF NOT EXISTS rental_requests (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 conversation_id uuid NOT NULL REFERENCES rental_conversations(id) ON DELETE CASCADE,
 unit_id uuid NOT NULL REFERENCES rental_units(id) ON DELETE CASCADE,
 renter_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 desired_move_in_on date NOT NULL,
 status text NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','approved','declined','cancelled')),
 tenancy_id uuid REFERENCES rental_tenancies(id) ON DELETE SET NULL,
 owner_note text NOT NULL DEFAULT '' CHECK(char_length(owner_note)<=500),
 created_at timestamptz NOT NULL DEFAULT now(),
 decided_at timestamptz
);
CREATE UNIQUE INDEX IF NOT EXISTS rental_requests_thread_pending_idx
 ON rental_requests(conversation_id) WHERE status='pending';
CREATE INDEX IF NOT EXISTS rental_requests_unit_status_idx ON rental_requests(unit_id,status,created_at DESC);

CREATE TABLE IF NOT EXISTS maintenance_requests (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 tenancy_id uuid NOT NULL REFERENCES rental_tenancies(id) ON DELETE CASCADE,
 created_by text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 title text NOT NULL CHECK(char_length(title) BETWEEN 2 AND 120),
 description text NOT NULL CHECK(char_length(description) BETWEEN 2 AND 2000),
 priority text NOT NULL DEFAULT 'normal' CHECK(priority IN ('low','normal','high','urgent')),
 photo_url text,
 status text NOT NULL DEFAULT 'reported' CHECK(status IN ('reported','in_progress','resolved')),
 created_at timestamptz NOT NULL DEFAULT now(),
 updated_at timestamptz NOT NULL DEFAULT now(),
 resolved_at timestamptz,
 CHECK(photo_url IS NULL OR photo_url ~ '^https://')
);
CREATE INDEX IF NOT EXISTS maintenance_tenancy_idx ON maintenance_requests(tenancy_id,status,created_at DESC);

CREATE TABLE IF NOT EXISTS rental_documents (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 tenancy_id uuid NOT NULL REFERENCES rental_tenancies(id) ON DELETE CASCADE,
 uploaded_by text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 kind text NOT NULL CHECK(kind IN ('lease','receipt','proof_of_payment','id','other')),
 label text NOT NULL CHECK(char_length(label) BETWEEN 1 AND 120),
 url text NOT NULL CHECK(url ~ '^https://'),
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS rental_documents_tenancy_idx ON rental_documents(tenancy_id,created_at DESC);

CREATE TABLE IF NOT EXISTS rental_reviews (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 tenancy_id uuid NOT NULL REFERENCES rental_tenancies(id) ON DELETE CASCADE,
 author_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 target_type text NOT NULL CHECK(target_type IN ('property','person')),
 target_user_id text REFERENCES users(id) ON DELETE SET NULL,
 listing_id uuid REFERENCES listings(id) ON DELETE SET NULL,
 rating integer NOT NULL CHECK(rating BETWEEN 1 AND 5),
 body text NOT NULL DEFAULT '' CHECK(char_length(body)<=1000),
 created_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE(tenancy_id,author_id,target_type)
);
CREATE INDEX IF NOT EXISTS rental_reviews_listing_idx ON rental_reviews(listing_id,created_at DESC);
CREATE INDEX IF NOT EXISTS rental_reviews_user_idx ON rental_reviews(target_user_id,created_at DESC);

ALTER TABLE rent_charges ADD COLUMN IF NOT EXISTS source text NOT NULL DEFAULT 'manual';
ALTER TABLE rent_charges DROP CONSTRAINT IF EXISTS rent_charges_source_check;
ALTER TABLE rent_charges ADD CONSTRAINT rent_charges_source_check CHECK(source IN ('manual','automatic'));

ALTER TABLE rental_notifications ADD COLUMN IF NOT EXISTS push_sent_at timestamptz;
ALTER TABLE rental_notifications DROP CONSTRAINT IF EXISTS rental_notifications_kind_check;
ALTER TABLE rental_notifications ADD CONSTRAINT rental_notifications_kind_check CHECK(kind IN (
 'inquiry','message','tenancy','payment','reminder','reaction','safety',
 'rental_request','maintenance','document','review'
));
CREATE INDEX IF NOT EXISTS rental_notifications_push_idx ON rental_notifications(created_at)
 WHERE push_sent_at IS NULL AND kind<>'message';
