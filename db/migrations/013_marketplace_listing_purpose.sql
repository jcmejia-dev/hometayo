-- Add marketplace purpose so HomeTayo can publish properties for rent or for sale.
-- Existing listings remain rentals by default.
ALTER TABLE listings ADD COLUMN IF NOT EXISTS listing_purpose text NOT NULL DEFAULT 'rent';
ALTER TABLE listings ADD COLUMN IF NOT EXISTS sale_price_centavos bigint;

ALTER TABLE listings DROP CONSTRAINT IF EXISTS listings_purpose_check;
ALTER TABLE listings ADD CONSTRAINT listings_purpose_check CHECK(listing_purpose IN ('rent','sale'));

ALTER TABLE listings DROP CONSTRAINT IF EXISTS listings_marketplace_price_check;
ALTER TABLE listings ADD CONSTRAINT listings_marketplace_price_check CHECK(
 (listing_purpose='rent' AND monthly_rent_centavos>=0)
 OR
 (listing_purpose='sale' AND sale_price_centavos IS NOT NULL AND sale_price_centavos>0)
);

CREATE INDEX IF NOT EXISTS listings_marketplace_search_idx
 ON listings(status,listing_purpose,city,published_at DESC);
