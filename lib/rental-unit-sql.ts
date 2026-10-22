// Explicit ownership conditions are shared by web and native callers.
export const OWNED_UNITS = `SELECT u.id,u.label,u.status,u.monthly_rent_centavos AS "monthlyRentCentavos"
 FROM rental_units u JOIN listings l ON l.id=u.listing_id
 JOIN owner_profiles o ON o.id=l.owner_id JOIN users a ON a.id=o.user_id
 WHERE l.id=$1::uuid AND a.id=$2 AND a.role='landlord' ORDER BY u.created_at,u.id`;

export const ENSURE_INITIAL_UNITS = `INSERT INTO rental_units(listing_id,label,status,monthly_rent_centavos,capacity)
 SELECT l.id,
  CASE l.rental_mode
   WHEN 'per_room' THEN 'Room '||slot.n::text
   WHEN 'per_bed' THEN 'Bed '||slot.n::text
   ELSE 'Whole property'
  END,
  'available',l.monthly_rent_centavos,1
 FROM listings l
 JOIN owner_profiles o ON o.id=l.owner_id
 JOIN users a ON a.id=o.user_id
 CROSS JOIN LATERAL generate_series(
  1,
  CASE
   WHEN l.rental_mode='whole_unit' THEN 1
   WHEN l.rental_mode='per_room' THEN GREATEST(1,COALESCE(NULLIF(l.available_slots,0),NULLIF(l.bedrooms,0),1))
   ELSE GREATEST(1,COALESCE(NULLIF(l.available_slots,0),1))
  END
 ) AS slot(n)
 WHERE l.id=$1::uuid AND a.id=$2 AND a.role='landlord' AND l.listing_purpose='rent'
  AND NOT EXISTS(SELECT 1 FROM rental_units existing WHERE existing.listing_id=l.id)
 RETURNING id`;

export const PUBLIC_UNITS = `SELECT u.id,u.label,u.status,u.monthly_rent_centavos AS "monthlyRentCentavos"
 FROM rental_units u JOIN listings l ON l.id=u.listing_id
 WHERE l.id=$1::uuid AND l.status='published' ORDER BY u.created_at,u.id`;
export const CREATE_UNIT = `INSERT INTO rental_units(listing_id,label,status,monthly_rent_centavos)
 SELECT l.id,$3,$4,$5 FROM listings l JOIN owner_profiles o ON o.id=l.owner_id
 JOIN users a ON a.id=o.user_id WHERE l.id=$1::uuid AND a.id=$2 AND a.role='landlord'
 RETURNING id`;
export const UPDATE_UNIT = `UPDATE rental_units u SET label=$4,status=$5,monthly_rent_centavos=$6,updated_at=now()
 FROM listings l JOIN owner_profiles o ON o.id=l.owner_id JOIN users a ON a.id=o.user_id
 WHERE u.listing_id=l.id AND l.id=$1::uuid AND a.id=$2 AND a.role='landlord' AND u.id=$3::uuid RETURNING u.id`;
