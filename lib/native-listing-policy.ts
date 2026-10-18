export const UPDATE_OWNER_PIN=`WITH changed AS (
  UPDATE listings l SET latitude=$1,longitude=$2,updated_at=now()
  FROM owner_profiles o WHERE l.owner_id=o.id AND o.user_id=$3 AND l.id=$4::uuid
    AND l.status IN ('draft','pending_review','published','paused','occupied')
  RETURNING l.id
) INSERT INTO platform_events(actor_user_id,kind,listing_id)
SELECT $3,'listing.submitted',id FROM changed RETURNING listing_id`;

export const PUBLISH_OWNER_RENTAL=`WITH changed AS (
 UPDATE listings l SET status='published',published_at=now(),last_confirmed_at=now(),updated_at=now()
 FROM owner_profiles o JOIN users u ON u.id=o.user_id
 WHERE l.owner_id=o.id AND u.id=$1 AND u.role='landlord' AND l.id=$2::uuid
 AND l.status IN ('draft','pending_review','paused') RETURNING l.id
) INSERT INTO platform_events(actor_user_id,kind,listing_id)
 SELECT $1,'listing.submitted',id FROM changed RETURNING listing_id`;
