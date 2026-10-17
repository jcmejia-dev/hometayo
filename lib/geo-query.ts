import { isPoint } from "./geo.ts";

export function buildMapQuery(url:URL,includeUnits=false) {

  const latitude=url.searchParams.get("lat"),longitude=url.searchParams.get("lng");
  const hasPoint=latitude!==null || longitude!==null;
  const point={latitude:Number(latitude),longitude:Number(longitude)};
  if(hasPoint && (latitude===null || longitude===null || latitude.trim()==="" || longitude.trim()==="" || !isPoint(point)))throw Error("Invalid coordinates");
  const radiusRaw=url.searchParams.get("radiusKm");
  const radius=radiusRaw===null?null:Number(radiusRaw);
  if(radius!==null && (!hasPoint || !Number.isFinite(radius) || radius<0.1 || radius>100))throw Error("Invalid radius");
  const type=url.searchParams.get("type")||null,city=url.searchParams.get("city")?.trim()||null;
  if(type && !["house","apartment","boarding_house","bedspace"].includes(type))throw Error("Invalid property type");
  if(city && city.length>80)throw Error("Invalid city");
  const budgetRaw=url.searchParams.get("maxRent");
  const budget=budgetRaw===null?null:Number(budgetRaw);
  if(budget!==null&&(!Number.isInteger(budget)||budget<100||budget>5000000))throw Error("Invalid maximum rent");
  const offset=Number(url.searchParams.get("offset") || 0);
  if(!Number.isInteger(offset)||offset<0||offset>100000)throw Error("Invalid page");
  const query=`
    WITH located AS (
      SELECT slug,title,property_type AS "propertyType",city,barangay,
        monthly_rent_centavos AS "monthlyRentCentavos",bedrooms,bathrooms,rental_mode AS "rentalMode",
        last_confirmed_at AS "lastConfirmedAt",latitude,longitude,published_at,description,
        COALESCE((SELECT json_agg(storage_key ORDER BY display_order) FROM listing_images WHERE listing_id=listings.id AND storage_key LIKE 'https://%'),'[]'::json) AS "photoUrls",
        ${includeUnits?"(SELECT json_build_object('total',count(*),'available',count(*) FILTER(WHERE status='available')) FROM rental_units WHERE listing_id=listings.id)":"NULL::json"} AS "unitCounts",
        CASE WHEN $1::double precision IS NOT NULL AND latitude IS NOT NULL AND longitude IS NOT NULL THEN
          6371*2*asin(sqrt(least(1.0,greatest(0.0,
            power(sin(radians(latitude-$1)/2),2)+cos(radians($1))*cos(radians(latitude))*power(sin(radians(longitude-$2)/2),2)
          )))) ELSE NULL END AS "distanceKm"
      FROM listings WHERE status='published' AND ($3::text IS NULL OR property_type=$3)
        AND ($4::text IS NULL OR lower(city)=lower($4))
        AND ($7::integer IS NULL OR monthly_rent_centavos <= $7)
    )
    SELECT * FROM located WHERE ($5::double precision IS NULL OR "distanceKm" <= $5)
    ORDER BY "distanceKm" ASC NULLS LAST,published_at DESC NULLS LAST,slug ASC LIMIT 101 OFFSET $6
  `;
  return {query,params:[hasPoint?point.latitude:null,hasPoint?point.longitude:null,type,city,radius,offset,budget===null?null:budget*100],offset};
}
