-- Neon-backed messaging state for delivery/seen receipts, typing presence, and mobile push tokens.
-- FCM/Expo remains transport only; HomeTayo data stays in PostgreSQL.

ALTER TABLE rental_messages ADD COLUMN IF NOT EXISTS delivered_at timestamptz;
ALTER TABLE rental_messages ADD COLUMN IF NOT EXISTS seen_at timestamptz;

CREATE TABLE IF NOT EXISTS message_typing_presence (
 conversation_id uuid NOT NULL REFERENCES rental_conversations(id) ON DELETE CASCADE,
 user_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 updated_at timestamptz NOT NULL DEFAULT now(),
 PRIMARY KEY(conversation_id,user_id)
);
CREATE INDEX IF NOT EXISTS message_typing_presence_updated_idx ON message_typing_presence(updated_at);

CREATE TABLE IF NOT EXISTS mobile_push_tokens (
 token text PRIMARY KEY,
 user_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 platform text NOT NULL DEFAULT 'android' CHECK(platform IN ('android','ios')),
 updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS mobile_push_tokens_user_idx ON mobile_push_tokens(user_id);

-- Remove the temporary notification-row typing workaround from earlier builds.
DELETE FROM rental_notifications WHERE event_key LIKE 'typing:%' AND body='__typing__';
