import {z} from "zod";
export const photoUrl=z.string().url().max(2000).refine(value=>{
 const u=new URL(value);return u.protocol==="https:"&&!u.username&&!u.password&&u.port===""&&!/^(localhost|127\.|10\.|192\.168\.|169\.254\.|\[|0\.)/i.test(u.hostname);
},"Use a public HTTPS image URL without credentials");
export const photoInput=z.object({listingId:z.string().uuid(),urls:z.array(photoUrl).max(8)});
export const SAVE_PHOTOS=`WITH owned AS MATERIALIZED (
 SELECT l.id FROM listings l JOIN owner_profiles o ON o.id=l.owner_id JOIN users a ON a.id=o.user_id
 WHERE l.id=$1::uuid AND a.id=$2 AND a.role='landlord' FOR UPDATE OF l
), removed AS (DELETE FROM listing_images WHERE listing_id IN(SELECT id FROM owned) RETURNING id),
 added AS (INSERT INTO listing_images(listing_id,storage_key,alt_text,display_order)
 SELECT owned.id,v.url,'Owner supplied rental photo',v.position::int FROM owned CROSS JOIN jsonb_array_elements_text($3::jsonb) WITH ORDINALITY AS v(url,position)
 WHERE (SELECT count(*) FROM removed)>=0 RETURNING id),
 changed AS (UPDATE listings SET status='pending_review',updated_at=now() WHERE id IN(SELECT id FROM owned) AND (SELECT count(*) FROM added)>=0 RETURNING id)
 SELECT id FROM changed`;
