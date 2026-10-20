export const END_TENANCY_V2=`WITH target AS (
 SELECT t.id,t.unit_id,t.conversation_id,c.renter_id FROM rental_tenancies t
 JOIN rental_conversations c ON c.id=t.conversation_id
 WHERE t.id=$2::uuid AND c.owner_id=$1 AND t.status IN ('active','ending') AND $3::date>=t.starts_on
 FOR UPDATE OF t
), done AS (
 UPDATE rental_tenancies t SET status='ended',ended_on=$3::date,ending_on=COALESCE(ending_on,$3::date)
 FROM target x WHERE t.id=x.id RETURNING t.*
), n AS (
 INSERT INTO rental_notifications(user_id,conversation_id,kind,body,event_key)
 SELECT x.renter_id,x.conversation_id,'tenancy','Tenancy ended on '||$3::date::text,'tenancy-ended:'||x.id FROM target x
 ON CONFLICT(event_key) DO UPDATE SET body=excluded.body,read_at=NULL,created_at=now()
)
SELECT id FROM done`;
