-- Additive availability management. No production data is changed automatically.
CREATE TABLE rental_units (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id uuid NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  label text NOT NULL CHECK (char_length(label) BETWEEN 1 AND 60),
  status text NOT NULL DEFAULT 'available' CHECK (status IN ('available','reserved','occupied','unavailable')),
  monthly_rent_centavos integer NOT NULL CHECK (monthly_rent_centavos BETWEEN 100 AND 500000000),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX rental_units_label_uidx ON rental_units(listing_id, lower(label));
CREATE INDEX rental_units_listing_status_idx ON rental_units(listing_id,status);
