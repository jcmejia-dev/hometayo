-- HomeTayo development schema v1. Apply only to the separate HomeTayo Neon database.
-- No sample owners, dummy properties, or personal data are inserted.
CREATE TABLE IF NOT EXISTS users (
 id TEXT PRIMARY KEY, email TEXT NOT NULL UNIQUE,
 display_name TEXT,
 role TEXT NOT NULL DEFAULT 'renter' CHECK (role IN ('renter','landlord','moderator','admin')),
 created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS owner_profiles (
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 user_id TEXT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
 public_name TEXT NOT NULL, created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS listings (
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 owner_id UUID NOT NULL REFERENCES owner_profiles(id),
 slug TEXT NOT NULL UNIQUE, title TEXT NOT NULL, description TEXT NOT NULL,
 property_type TEXT NOT NULL CHECK (property_type IN ('house','apartment','boarding_house','bedspace')),
 rental_mode TEXT NOT NULL DEFAULT 'whole_unit' CHECK (rental_mode IN ('whole_unit','per_room','per_bed')),
 status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','pending_review','published','rejected','paused','occupied','removed')),
 province TEXT NOT NULL DEFAULT 'South Cotabato',
 city TEXT NOT NULL, barangay TEXT NOT NULL,
 monthly_rent_centavos INTEGER NOT NULL CHECK (monthly_rent_centavos >= 0),
 bedrooms INTEGER CHECK (bedrooms IS NULL OR bedrooms >= 0),
 bathrooms INTEGER CHECK (bathrooms IS NULL OR bathrooms >= 0),
 available_slots INTEGER CHECK (available_slots IS NULL OR available_slots >= 0),
 furnished TEXT NOT NULL DEFAULT 'unspecified' CHECK (furnished IN ('yes','no','partial','unspecified')),
 owner_contact_kind TEXT NOT NULL DEFAULT 'none' CHECK (owner_contact_kind IN ('messenger','phone','none')),
 owner_contact_value TEXT,
 published_at TIMESTAMPTZ, last_confirmed_at TIMESTAMPTZ,
 created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
 CONSTRAINT published_requires_confirmation CHECK (status <> 'published' OR (published_at IS NOT NULL AND last_confirmed_at IS NOT NULL))
);
CREATE INDEX IF NOT EXISTS listings_public_search_idx ON listings(status,city,monthly_rent_centavos);
CREATE INDEX IF NOT EXISTS listings_owner_status_idx ON listings(owner_id,status);
CREATE TABLE IF NOT EXISTS listing_images (
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
 storage_key TEXT NOT NULL, alt_text TEXT, display_order INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS listing_images_order_idx ON listing_images(listing_id,display_order);
CREATE TABLE IF NOT EXISTS listing_reviews (
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 listing_id UUID NOT NULL REFERENCES listings(id),
 reviewer_id TEXT NOT NULL REFERENCES users(id),
 decision TEXT NOT NULL CHECK (decision IN ('approved','rejected','removed')),
 reason TEXT, created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
