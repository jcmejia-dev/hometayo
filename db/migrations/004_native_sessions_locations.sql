CREATE TABLE IF NOT EXISTS native_sessions (
  token_hash TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS native_sessions_user_idx ON native_sessions(user_id);
ALTER TABLE listings ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION;
ALTER TABLE listings ADD CONSTRAINT listings_coordinates_valid CHECK (
  (latitude IS NULL AND longitude IS NULL) OR
  (latitude IS NOT NULL AND longitude IS NOT NULL AND latitude BETWEEN -90 AND 90 AND longitude BETWEEN -180 AND 180)
);
CREATE INDEX IF NOT EXISTS listings_published_coordinates_idx ON listings(latitude,longitude) WHERE status='published';
