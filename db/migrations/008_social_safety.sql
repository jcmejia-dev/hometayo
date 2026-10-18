-- Social rental interactions, safer messaging, and admin account moderation.
ALTER TABLE users ADD COLUMN IF NOT EXISTS account_status text NOT NULL DEFAULT 'active';
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_account_status_check;
ALTER TABLE users ADD CONSTRAINT users_account_status_check CHECK(account_status IN ('active','flagged','banned'));

ALTER TABLE rental_messages ADD COLUMN IF NOT EXISTS reply_to_id uuid REFERENCES rental_messages(id) ON DELETE SET NULL;
ALTER TABLE rental_messages ADD COLUMN IF NOT EXISTS media_type text NOT NULL DEFAULT 'text';
ALTER TABLE rental_messages DROP CONSTRAINT IF EXISTS rental_messages_media_type_check;
ALTER TABLE rental_messages ADD CONSTRAINT rental_messages_media_type_check CHECK(media_type IN ('text','gif'));

CREATE TABLE IF NOT EXISTS message_reactions (
 message_id uuid NOT NULL REFERENCES rental_messages(id) ON DELETE CASCADE,
 user_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 emoji text NOT NULL CHECK(emoji IN ('👍','❤️','😂','😮','😢','🙏')),
 created_at timestamptz NOT NULL DEFAULT now(),
 PRIMARY KEY(message_id,user_id)
);

ALTER TABLE rental_notifications ALTER COLUMN conversation_id DROP NOT NULL;
ALTER TABLE rental_notifications ADD COLUMN IF NOT EXISTS listing_id uuid REFERENCES listings(id) ON DELETE CASCADE;
ALTER TABLE rental_notifications DROP CONSTRAINT IF EXISTS rental_notifications_kind_check;
ALTER TABLE rental_notifications ADD CONSTRAINT rental_notifications_kind_check
 CHECK(kind IN ('inquiry','message','tenancy','payment','reminder','reaction','safety'));

CREATE TABLE IF NOT EXISTS safety_reports (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 reporter_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 target_user_id text REFERENCES users(id) ON DELETE SET NULL,
 listing_id uuid REFERENCES listings(id) ON DELETE SET NULL,
 message_id uuid REFERENCES rental_messages(id) ON DELETE SET NULL,
 category text NOT NULL CHECK(category IN ('scam','harassment','inappropriate_message','fake_listing','other')),
 details text NOT NULL DEFAULT '' CHECK(char_length(details)<=1000),
 status text NOT NULL DEFAULT 'open' CHECK(status IN ('open','reviewed','actioned','dismissed')),
 admin_note text CHECK(char_length(admin_note)<=1000),
 created_at timestamptz NOT NULL DEFAULT now(),
 reviewed_at timestamptz,
 reviewed_by text REFERENCES users(id) ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS safety_reports_status_idx ON safety_reports(status,created_at DESC);
CREATE INDEX IF NOT EXISTS safety_reports_target_idx ON safety_reports(target_user_id,created_at DESC);
