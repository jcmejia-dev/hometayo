export const UPDATE_OWNER_PIN=`WITH changed AS (
  UPDATE listings l SET latitude=$1,longitude=$2,status='pending_review',published_at=NULL,updated_at=now()
  FROM owner_profiles o WHERE l.owner_id=o.id AND o.user_id=$3 AND l.id=$4::uuid
    AND l.status IN ('draft','pending_review','published','paused','occupied','rejected')
  RETURNING l.id
) INSERT INTO platform_events(actor_user_id,kind,listing_id)
SELECT $3,'listing.submitted',id FROM changed RETURNING listing_id`;
