-- Small, account-owned profile thumbnail. No changes to roles or existing listings.
ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_photo TEXT;
ALTER TABLE users ADD CONSTRAINT users_profile_photo_size_ck
  CHECK (profile_photo IS NULL OR octet_length(profile_photo) <= 180000);
