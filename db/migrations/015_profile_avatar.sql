-- Account-synced, lightweight avatar customization for the native app.
ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_config JSONB NOT NULL DEFAULT '{"skin":"#E8B894","hair":"waves","hairColor":"#171717","outfit":"#1F6F50","background":"#DFF4E8","expression":"smile"}'::jsonb;

ALTER TABLE users ADD CONSTRAINT users_avatar_config_object_ck
  CHECK (jsonb_typeof(avatar_config) = 'object');
