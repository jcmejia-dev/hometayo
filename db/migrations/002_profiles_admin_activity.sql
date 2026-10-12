-- Job 4: user-chosen profile settings and scoped operational audit.
-- Does not modify existing roles, emails, listings or owner records.
ALTER TABLE users ADD COLUMN IF NOT EXISTS preferred_name TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS home_city TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS preferred_property_type TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS preferred_budget_pesos INTEGER;

-- Constraint names are new; for a pre-existing partially upgraded DB, inspect before running.
ALTER TABLE users ADD CONSTRAINT home_city_length_ck CHECK (home_city IS NULL OR char_length(home_city) BETWEEN 2 AND 80);
ALTER TABLE users ADD CONSTRAINT preferred_name_length_ck CHECK (preferred_name IS NULL OR char_length(preferred_name) BETWEEN 2 AND 80);
ALTER TABLE users ADD CONSTRAINT preferred_type_ck CHECK (preferred_property_type IS NULL OR preferred_property_type IN ('house','apartment','boarding_house','bedspace'));
ALTER TABLE users ADD CONSTRAINT preferred_budget_ck CHECK (preferred_budget_pesos IS NULL OR preferred_budget_pesos BETWEEN 100 AND 5000000);

CREATE TABLE IF NOT EXISTS platform_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_user_id TEXT NOT NULL REFERENCES users(id),
  kind TEXT NOT NULL CHECK (kind IN ('listing.submitted','listing.paused','listing.approved','listing.rejected')),
  listing_id UUID REFERENCES listings(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS platform_events_recent_idx ON platform_events(created_at DESC);
CREATE INDEX IF NOT EXISTS platform_events_actor_idx ON platform_events(actor_user_id, created_at DESC);
