CREATE TABLE IF NOT EXISTS platform_announcements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL CHECK(char_length(title) BETWEEN 2 AND 120),
  body text NOT NULL CHECK(char_length(body) BETWEEN 2 AND 1000),
  audience text NOT NULL DEFAULT 'all' CHECK(audience IN ('all','renter','landlord')),
  tone text NOT NULL DEFAULT 'update' CHECK(tone IN ('update','info','maintenance')),
  active boolean NOT NULL DEFAULT true,
  created_by text NOT NULL REFERENCES users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  archived_at timestamptz
);
CREATE INDEX IF NOT EXISTS platform_announcements_active_idx ON platform_announcements(active,created_at DESC);
