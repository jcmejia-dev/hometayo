-- Rental offer negotiation before reservation/tenancy commitment.
-- Offers do not consume room capacity until accepted. Accepting the latest offer
-- atomically creates the existing HomeTayo reservation/tenancy workflow.

CREATE TABLE rental_offers (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 conversation_id uuid NOT NULL REFERENCES rental_conversations(id) ON DELETE CASCADE,
 unit_id uuid NOT NULL REFERENCES rental_units(id) ON DELETE CASCADE,
 parent_offer_id uuid REFERENCES rental_offers(id) ON DELETE SET NULL,
 proposed_by text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 status text NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','accepted','declined','countered','withdrawn')),
 monthly_rent_centavos integer NOT NULL CHECK(monthly_rent_centavos BETWEEN 100 AND 500000000),
 security_deposit_centavos integer NOT NULL DEFAULT 0 CHECK(security_deposit_centavos BETWEEN 0 AND 500000000),
 reservation_amount_centavos integer NOT NULL DEFAULT 0 CHECK(reservation_amount_centavos BETWEEN 0 AND 500000000),
 reservation_credit text NOT NULL DEFAULT 'none' CHECK(reservation_credit IN ('none','first_rent','deposit')),
 reservation_hours integer NOT NULL DEFAULT 48 CHECK(reservation_hours BETWEEN 1 AND 168),
 lease_starts_on date NOT NULL,
 move_in_on date NOT NULL,
 lease_ends_on date,
 note text NOT NULL DEFAULT '' CHECK(char_length(note)<=500),
 accepted_by text REFERENCES users(id) ON DELETE SET NULL,
 accepted_at timestamptz,
 responded_at timestamptz,
 request_id uuid UNIQUE REFERENCES rental_requests(id) ON DELETE SET NULL,
 reservation_id uuid UNIQUE REFERENCES rental_reservations(id) ON DELETE SET NULL,
 created_at timestamptz NOT NULL DEFAULT now(),
 CHECK(move_in_on>=lease_starts_on),
 CHECK(lease_ends_on IS NULL OR lease_ends_on>=lease_starts_on),
 CHECK((reservation_credit<>'first_rent' OR reservation_amount_centavos<=monthly_rent_centavos)
   AND (reservation_credit<>'deposit' OR reservation_amount_centavos<=security_deposit_centavos))
);

CREATE UNIQUE INDEX rental_offers_thread_pending_idx
 ON rental_offers(conversation_id) WHERE status='pending';
CREATE INDEX rental_offers_thread_history_idx
 ON rental_offers(conversation_id,created_at DESC);
CREATE INDEX rental_offers_unit_idx
 ON rental_offers(unit_id,created_at DESC);

ALTER TABLE rental_notifications DROP CONSTRAINT IF EXISTS rental_notifications_kind_check;
ALTER TABLE rental_notifications ADD CONSTRAINT rental_notifications_kind_check CHECK(kind IN (
 'inquiry','message','tenancy','payment','reminder','reaction','safety',
 'rental_request','reservation','payment_proof','maintenance','document','review','offer'
));

-- Keep the older Request to Rent flow and the negotiation flow mutually exclusive.
CREATE OR REPLACE FUNCTION prevent_pending_request_during_offer() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 IF NEW.status='pending' AND EXISTS(
  SELECT 1 FROM rental_offers o WHERE o.conversation_id=NEW.conversation_id AND o.status='pending'
 ) THEN
  RAISE EXCEPTION 'Resolve the active rental offer before creating a rental request';
 END IF;
 RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS rental_request_offer_guard ON rental_requests;
CREATE TRIGGER rental_request_offer_guard BEFORE INSERT OR UPDATE OF status,conversation_id
 ON rental_requests FOR EACH ROW EXECUTE FUNCTION prevent_pending_request_during_offer();
