export const INQUIRE=`WITH c AS (
 INSERT INTO rental_conversations(listing_id,owner_id,renter_id)
 SELECT l.id,o.user_id,$1 FROM listings l JOIN owner_profiles o ON o.id=l.owner_id
 JOIN users a ON a.id=$1 WHERE l.slug=$2 AND l.status='published' AND a.role='renter' AND o.user_id<>$1
 ON CONFLICT(listing_id,renter_id) DO UPDATE SET renter_id=excluded.renter_id RETURNING *
), n AS (INSERT INTO rental_notifications(user_id,conversation_id,kind,body,event_key)
 SELECT owner_id,id,'inquiry','New rental inquiry','inquiry:'||id FROM c ON CONFLICT(event_key) DO NOTHING)
 SELECT id FROM c`;
export const MESSAGE=`WITH m AS (
 INSERT INTO rental_messages(id,conversation_id,sender_id,body)
 SELECT $3::uuid,c.id,$1,$4 FROM rental_conversations c WHERE c.id=$2::uuid AND $1 IN(c.owner_id,c.renter_id)
 ON CONFLICT(id) DO NOTHING RETURNING *
), n AS (INSERT INTO rental_notifications(user_id,conversation_id,kind,body,event_key)
 SELECT CASE WHEN c.owner_id=$1 THEN c.renter_id ELSE c.owner_id END,c.id,'message','New message','message:'||m.id
 FROM m JOIN rental_conversations c ON c.id=m.conversation_id ON CONFLICT(event_key) DO NOTHING)
 SELECT id FROM m`;
export const INVITE=`WITH target AS MATERIALIZED (
 SELECT u.id,c.id AS cid FROM rental_units u JOIN listings l ON l.id=u.listing_id
 JOIN owner_profiles o ON o.id=l.owner_id JOIN users a ON a.id=o.user_id
 JOIN rental_conversations c ON c.listing_id=l.id AND c.owner_id=a.id
 WHERE c.id=$2::uuid AND u.id=$3::uuid AND a.id=$1 AND a.role='landlord' AND u.status='available' FOR UPDATE OF u
), t AS (INSERT INTO rental_tenancies(conversation_id,unit_id,monthly_rent_centavos,starts_on)
 SELECT cid,id,$4,$5::date FROM target RETURNING *), u AS (
 UPDATE rental_units SET status='reserved',updated_at=now() FROM t WHERE rental_units.id=t.unit_id RETURNING rental_units.id
), n AS (INSERT INTO rental_notifications(user_id,conversation_id,kind,body,event_key)
 SELECT c.renter_id,c.id,'tenancy','Review your tenancy invitation','invite:'||t.id FROM t JOIN rental_conversations c ON c.id=t.conversation_id)
 SELECT id FROM t`;
export const ACCEPT=`WITH t AS (
 UPDATE rental_tenancies t SET status='active' FROM rental_conversations c
 WHERE c.id=t.conversation_id AND t.id=$2::uuid AND c.renter_id=$1 AND t.status='invited' RETURNING t.*
), u AS (UPDATE rental_units SET status='occupied',updated_at=now() FROM t WHERE rental_units.id=t.unit_id RETURNING rental_units.id),
 n AS (INSERT INTO rental_notifications(user_id,conversation_id,kind,body,event_key)
 SELECT c.owner_id,c.id,'tenancy','Renter accepted the tenancy','accept:'||t.id FROM t JOIN rental_conversations c ON c.id=t.conversation_id)
 SELECT id FROM t`;
export const DECLINE=`WITH t AS (
 UPDATE rental_tenancies t SET status='declined' FROM rental_conversations c
 WHERE c.id=t.conversation_id AND t.id=$2::uuid AND $1 IN(c.renter_id,c.owner_id) AND t.status='invited' RETURNING t.*
), u AS (UPDATE rental_units SET status='available',updated_at=now() FROM t WHERE rental_units.id=t.unit_id RETURNING rental_units.id),
 n AS (INSERT INTO rental_notifications(user_id,conversation_id,kind,body,event_key)
 SELECT CASE WHEN c.owner_id=$1 THEN c.renter_id ELSE c.owner_id END,c.id,'tenancy','Tenancy invitation closed','decline:'||t.id FROM t JOIN rental_conversations c ON c.id=t.conversation_id)
 SELECT id FROM t`;
export const END_TENANCY=`WITH t AS (
 UPDATE rental_tenancies t SET status='ended',ended_on=$3::date FROM rental_conversations c
 WHERE c.id=t.conversation_id AND c.owner_id=$1 AND t.id=$2::uuid AND t.status='active'
 AND $3::date>=t.starts_on AND $3::date<=(now() AT TIME ZONE 'Asia/Manila')::date RETURNING t.*
), u AS (UPDATE rental_units SET status='available',updated_at=now() FROM t WHERE rental_units.id=t.unit_id RETURNING rental_units.id),
 n AS (INSERT INTO rental_notifications(user_id,conversation_id,kind,body,event_key)
 SELECT c.renter_id,c.id,'tenancy','Owner recorded your move-out','end:'||t.id FROM t JOIN rental_conversations c ON c.id=t.conversation_id)
 SELECT id FROM t`;
export const CHARGE=`WITH r AS (
 INSERT INTO rent_charges(tenancy_id,due_on,description,amount_centavos)
 SELECT t.id,$3::date,$4,$5 FROM rental_tenancies t JOIN rental_conversations c ON c.id=t.conversation_id
 WHERE t.id=$2::uuid AND c.owner_id=$1 AND t.status='active'
 AND $3::date>=t.starts_on
 ON CONFLICT(tenancy_id,due_on,description) WHERE voided_at IS NULL DO NOTHING RETURNING *
), n AS (INSERT INTO rental_notifications(user_id,conversation_id,kind,body,event_key)
 SELECT c.renter_id,c.id,'payment','A rent charge was added','charge:'||r.id FROM r JOIN rental_tenancies t ON t.id=r.tenancy_id JOIN rental_conversations c ON c.id=t.conversation_id)
 SELECT id FROM r`;
export const PAYMENT=`WITH p AS (
 INSERT INTO rent_payments(id,charge_id,amount_centavos,paid_on,note,recorded_by)
 SELECT $3::uuid,r.id,$4,$5::date,$6,$1 FROM rent_charges r JOIN rental_tenancies t ON t.id=r.tenancy_id
 JOIN rental_conversations c ON c.id=t.conversation_id WHERE r.id=$2::uuid AND c.owner_id=$1 AND r.voided_at IS NULL
 AND $5::date<=(now() AT TIME ZONE 'Asia/Manila')::date
 ON CONFLICT(id) DO NOTHING RETURNING *
), n AS (INSERT INTO rental_notifications(user_id,conversation_id,kind,body,event_key)
 SELECT c.renter_id,c.id,'payment','Owner recorded a payment. Check your ledger.','payment:'||p.id
 FROM p JOIN rent_charges r ON r.id=p.charge_id JOIN rental_tenancies t ON t.id=r.tenancy_id JOIN rental_conversations c ON c.id=t.conversation_id)
 SELECT id FROM p`;
export const VOID_PAYMENT=`WITH p AS (
 UPDATE rent_payments p SET voided_at=now(),void_reason=$3 FROM rent_charges r JOIN rental_tenancies t ON t.id=r.tenancy_id JOIN rental_conversations c ON c.id=t.conversation_id
 WHERE p.charge_id=r.id AND p.id=$2::uuid AND c.owner_id=$1 AND p.voided_at IS NULL RETURNING p.*
), n AS (INSERT INTO rental_notifications(user_id,conversation_id,kind,body,event_key)
 SELECT c.renter_id,c.id,'payment','A payment entry was voided. Check the correction reason.','void:'||p.id
 FROM p JOIN rent_charges r ON r.id=p.charge_id JOIN rental_tenancies t ON t.id=r.tenancy_id JOIN rental_conversations c ON c.id=t.conversation_id)
 SELECT id FROM p`;
export const VOID_CHARGE=`WITH r AS (
 UPDATE rent_charges r SET voided_at=now(),void_reason=$3 FROM rental_tenancies t JOIN rental_conversations c ON c.id=t.conversation_id
 WHERE r.tenancy_id=t.id AND r.id=$2::uuid AND c.owner_id=$1 AND r.voided_at IS NULL
 AND NOT EXISTS(SELECT 1 FROM rent_payments p WHERE p.charge_id=r.id AND p.voided_at IS NULL) RETURNING r.*
), n AS (INSERT INTO rental_notifications(user_id,conversation_id,kind,body,event_key)
 SELECT c.renter_id,c.id,'payment','A rent charge was voided. Check the correction reason.','void-charge:'||r.id
 FROM r JOIN rental_tenancies t ON t.id=r.tenancy_id JOIN rental_conversations c ON c.id=t.conversation_id)
 SELECT id FROM r`;
export const REMIND=`INSERT INTO rental_notifications(user_id,conversation_id,kind,body,event_key)
 SELECT c.renter_id,c.id,'reminder','Your owner sent a payment reminder. Check your ledger.',
 'remind:'||r.id||':'||((now() AT TIME ZONE 'Asia/Manila')::date)::text FROM rent_charges r
 JOIN rental_tenancies t ON t.id=r.tenancy_id JOIN rental_conversations c ON c.id=t.conversation_id
 WHERE r.id=$2::uuid AND c.owner_id=$1 AND r.voided_at IS NULL AND r.amount_centavos>COALESCE((SELECT sum(amount_centavos) FROM rent_payments WHERE charge_id=r.id AND voided_at IS NULL),0)
 ON CONFLICT(event_key) DO NOTHING RETURNING id`;
export const REACT=`INSERT INTO listing_reactions(listing_id,user_id,kind)
 SELECT id,$1,$3 FROM listings WHERE slug=$2 AND status='published'
 ON CONFLICT(listing_id,user_id) DO UPDATE SET kind=excluded.kind RETURNING listing_id AS id`;
export const UNREACT=`DELETE FROM listing_reactions r USING listings l WHERE r.listing_id=l.id AND l.slug=$2 AND r.user_id=$1 RETURNING r.listing_id AS id`;
export const READ_NOTICE=`UPDATE rental_notifications SET read_at=now() WHERE user_id=$1 AND id=$2::uuid RETURNING id`;
export const CONVERSATIONS=`SELECT c.id,c.listing_id AS "listingId",l.title,l.slug,c.owner_id=$1 AS "isOwner",
 CASE WHEN c.owner_id=$1 THEN COALESCE(r.preferred_name,r.display_name,'Renter') ELSE COALESCE(o.preferred_name,o.display_name,'Owner') END AS "otherName"
 FROM rental_conversations c JOIN listings l ON l.id=c.listing_id JOIN users r ON r.id=c.renter_id JOIN users o ON o.id=c.owner_id
 WHERE $1 IN(c.owner_id,c.renter_id) ORDER BY c.created_at DESC LIMIT 200`;
export const THREAD_MESSAGES=`SELECT m.id,m.body,m.sender_id=$1 AS mine,m.created_at AS "createdAt" FROM rental_messages m JOIN rental_conversations c ON c.id=m.conversation_id
 WHERE c.id=$2::uuid AND $1 IN(c.owner_id,c.renter_id) ORDER BY m.created_at DESC,m.id DESC LIMIT 100`;
export const THREAD_MESSAGES_PAGE=THREAD_MESSAGES.replace(" ORDER BY",` AND ($3::uuid IS NULL OR (m.created_at,m.id)<(SELECT created_at,id FROM rental_messages WHERE id=$3::uuid AND conversation_id=c.id)) ORDER BY`);
export const TENANCIES=`SELECT t.id,t.status,t.monthly_rent_centavos AS "monthlyRentCentavos",t.starts_on::text AS "startsOn",t.ended_on::text AS "endedOn",u.label
 FROM rental_tenancies t JOIN rental_conversations c ON c.id=t.conversation_id JOIN rental_units u ON u.id=t.unit_id
 WHERE c.id=$2::uuid AND $1 IN(c.owner_id,c.renter_id) ORDER BY t.created_at DESC`;
export const CHARGES=`SELECT r.id,r.tenancy_id AS "tenancyId",r.description,r.due_on::text AS "dueOn",r.amount_centavos AS "amountCentavos",r.voided_at AS "voidedAt",r.void_reason AS "voidReason",
 COALESCE((SELECT sum(p.amount_centavos) FROM rent_payments p WHERE p.charge_id=r.id AND p.voided_at IS NULL),0)::bigint AS "paidCentavos"
 FROM rent_charges r JOIN rental_tenancies t ON t.id=r.tenancy_id JOIN rental_conversations c ON c.id=t.conversation_id
 WHERE c.id=$2::uuid AND $1 IN(c.owner_id,c.renter_id) ORDER BY r.due_on DESC`;
export const PAYMENTS=`SELECT p.id,p.charge_id AS "chargeId",p.amount_centavos AS "amountCentavos",p.paid_on::text AS "paidOn",p.note,p.voided_at AS "voidedAt",p.void_reason AS "voidReason"
 FROM rent_payments p JOIN rent_charges r ON r.id=p.charge_id JOIN rental_tenancies t ON t.id=r.tenancy_id JOIN rental_conversations c ON c.id=t.conversation_id
 WHERE c.id=$2::uuid AND $1 IN(c.owner_id,c.renter_id) ORDER BY p.created_at DESC`;
export const NOTICES=`SELECT id,conversation_id AS "conversationId",kind,body,read_at AS "readAt",created_at AS "createdAt" FROM rental_notifications WHERE user_id=$1 ORDER BY created_at DESC LIMIT 100`;
export const SUMMARY=`SELECT
 (SELECT count(*) FROM listings l JOIN owner_profiles o ON o.id=l.owner_id WHERE o.user_id=$1)::int AS properties,
 (SELECT count(*) FROM rental_units u JOIN listings l ON l.id=u.listing_id JOIN owner_profiles o ON o.id=l.owner_id WHERE o.user_id=$1 AND u.status='available')::int AS available,
 (SELECT count(*) FROM rental_units u JOIN listings l ON l.id=u.listing_id JOIN owner_profiles o ON o.id=l.owner_id WHERE o.user_id=$1 AND u.status='occupied')::int AS occupied,
 COALESCE((SELECT sum(r.amount_centavos) FROM rent_charges r JOIN rental_tenancies t ON t.id=r.tenancy_id JOIN rental_conversations c ON c.id=t.conversation_id WHERE c.owner_id=$1 AND r.voided_at IS NULL AND to_char(r.due_on,'YYYY-MM')=$2),0)::bigint AS "expectedCentavos",
 COALESCE((SELECT sum(p.amount_centavos) FROM rent_payments p JOIN rent_charges r ON r.id=p.charge_id JOIN rental_tenancies t ON t.id=r.tenancy_id JOIN rental_conversations c ON c.id=t.conversation_id WHERE c.owner_id=$1 AND p.voided_at IS NULL AND to_char(p.paid_on,'YYYY-MM')=$2),0)::bigint AS "collectedCentavos",
 COALESCE((SELECT sum(GREATEST(0,r.amount_centavos-COALESCE((SELECT sum(p.amount_centavos) FROM rent_payments p WHERE p.charge_id=r.id AND p.voided_at IS NULL),0))) FROM rent_charges r JOIN rental_tenancies t ON t.id=r.tenancy_id JOIN rental_conversations c ON c.id=t.conversation_id WHERE c.owner_id=$1 AND r.voided_at IS NULL AND r.due_on<=(now() AT TIME ZONE 'Asia/Manila')::date),0)::bigint AS "outstandingCentavos"`;
