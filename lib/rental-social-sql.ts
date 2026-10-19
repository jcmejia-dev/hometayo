export const MESSAGE_V2=`WITH c AS (
 SELECT * FROM rental_conversations WHERE id=$2::uuid AND $1 IN(owner_id,renter_id)
), m AS (
 INSERT INTO rental_messages(id,conversation_id,sender_id,body,reply_to_id,media_type)
 SELECT $3::uuid,c.id,$1,$4,$5::uuid,$6 FROM c
 WHERE $5::uuid IS NULL OR EXISTS(SELECT 1 FROM rental_messages parent WHERE parent.id=$5::uuid AND parent.conversation_id=c.id)
 ON CONFLICT(id) DO NOTHING RETURNING *
), n AS (INSERT INTO rental_notifications(user_id,conversation_id,kind,body,event_key)
 SELECT CASE WHEN c.owner_id=$1 THEN c.renter_id ELSE c.owner_id END,c.id,'message','New message','message:'||m.id
 FROM m JOIN c ON c.id=m.conversation_id ON CONFLICT(event_key) DO NOTHING)
 SELECT id FROM m`;

export const MESSAGE_REACT=`INSERT INTO message_reactions(message_id,user_id,emoji)
 SELECT m.id,$1,$3 FROM rental_messages m JOIN rental_conversations c ON c.id=m.conversation_id
 WHERE m.id=$2::uuid AND $1 IN(c.owner_id,c.renter_id)
 ON CONFLICT(message_id,user_id) DO UPDATE SET emoji=excluded.emoji,created_at=now() RETURNING message_id AS id`;
export const MESSAGE_UNREACT=`DELETE FROM message_reactions mr USING rental_messages m,rental_conversations c
 WHERE mr.message_id=m.id AND m.conversation_id=c.id AND mr.message_id=$2::uuid AND mr.user_id=$1 AND $1 IN(c.owner_id,c.renter_id) RETURNING mr.message_id AS id`;

export const TYPING=`WITH c AS (
 SELECT * FROM rental_conversations WHERE id=$2::uuid AND $1 IN(owner_id,renter_id)
), t AS (
 INSERT INTO rental_notifications(user_id,conversation_id,kind,body,event_key)
 SELECT CASE WHEN c.owner_id=$1 THEN c.renter_id ELSE c.owner_id END,c.id,'typing','typing','typing:'||c.id::text||':'||$1
 FROM c ON CONFLICT(event_key) DO UPDATE SET created_at=now(),read_at=NULL RETURNING id
) SELECT id FROM t`;

export const TYPING_STATE=`SELECT EXISTS(
 SELECT 1 FROM rental_notifications n WHERE n.user_id=$1 AND n.conversation_id=$2::uuid AND n.kind='typing' AND n.created_at>now()-interval '6 seconds'
) AS typing`;

export const CONVERSATIONS_SOCIAL=`SELECT c.id,c.listing_id AS "listingId",l.title,l.slug,c.owner_id=$1 AS "isOwner",
 CASE WHEN c.owner_id=$1 THEN COALESCE(r.preferred_name,r.display_name,'Renter') ELSE COALESCE(o.preferred_name,o.display_name,'Owner') END AS "otherName",
 CASE WHEN c.owner_id=$1 THEN r.profile_photo ELSE o.profile_photo END AS "otherPhoto",
 CASE WHEN c.owner_id=$1 THEN c.renter_id ELSE c.owner_id END AS "otherUserId",
 lm.body AS "lastMessage",lm.created_at AS "lastMessageAt",lm.sender_id=$1 AS "lastMessageMine",lm.media_type AS "lastMediaType"
 FROM rental_conversations c JOIN listings l ON l.id=c.listing_id JOIN users r ON r.id=c.renter_id JOIN users o ON o.id=c.owner_id
 LEFT JOIN LATERAL (SELECT m.body,m.created_at,m.sender_id,m.media_type FROM rental_messages m WHERE m.conversation_id=c.id ORDER BY m.created_at DESC,m.id DESC LIMIT 1) lm ON true
 WHERE $1 IN(c.owner_id,c.renter_id) ORDER BY COALESCE(lm.created_at,c.created_at) DESC LIMIT 200`;

export const THREAD_MESSAGES_SOCIAL=`SELECT m.id,m.body,m.sender_id AS "senderId",m.sender_id=$1 AS mine,m.created_at AS "createdAt",
 m.reply_to_id AS "replyToId",parent.body AS "replyBody",m.media_type AS "mediaType",delivery.created_at AS "deliveredAt",delivery.read_at AS "seenAt",
 COALESCE((SELECT json_agg(json_build_object('emoji',rx.emoji,'count',rx.count,'mine',rx.mine) ORDER BY rx.emoji) FROM (
   SELECT mr.emoji,count(*)::int AS count,bool_or(mr.user_id=$1) AS mine FROM message_reactions mr WHERE mr.message_id=m.id GROUP BY mr.emoji
 ) rx),'[]'::json) AS reactions
 FROM rental_messages m JOIN rental_conversations c ON c.id=m.conversation_id LEFT JOIN rental_messages parent ON parent.id=m.reply_to_id
 LEFT JOIN rental_notifications delivery ON delivery.event_key='message:'||m.id::text AND delivery.conversation_id=c.id
 WHERE c.id=$2::uuid AND $1 IN(c.owner_id,c.renter_id)
 AND ($3::uuid IS NULL OR (m.created_at,m.id)<(SELECT created_at,id FROM rental_messages WHERE id=$3::uuid AND conversation_id=c.id))
 ORDER BY m.created_at DESC,m.id DESC LIMIT 100`;
