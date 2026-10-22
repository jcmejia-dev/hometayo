import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { nativeAccount, nativeDb } from "@/lib/native-auth";
import { consumeRateLimit } from "@/lib/email-auth";
import { generateSlug, propertyInputSchema } from "@/lib/property-validation";
import { z } from "zod";
import {UPDATE_OWNER_PIN,PUBLISH_OWNER_RENTAL} from "@/lib/native-listing-policy";
export const dynamic="force-dynamic";
const reply=(body:unknown,status=200)=>NextResponse.json(body,{status,headers:{"Cache-Control":"no-store"}});
const ownerEdit=z.object({id:z.string().uuid(),action:z.literal("update"),title:z.string().trim().min(3).max(120),description:z.string().trim().min(30).max(3000),propertyType:z.enum(["house","apartment","boarding_house","bedspace"]),listingPurpose:z.enum(["rent","sale"]),city:z.string().trim().min(2).max(80),province:z.string().trim().min(2).max(80),barangay:z.string().trim().min(1).max(80),monthlyRent:z.coerce.number().min(0).max(5000000),salePrice:z.coerce.number().min(0).max(500000000),latitude:z.number().min(-90).max(90).nullable().optional(),longitude:z.number().min(-180).max(180).nullable().optional()}).superRefine((v,ctx)=>{if(v.listingPurpose==="rent"&&v.monthlyRent<100)ctx.addIssue({code:"custom",message:"Monthly rent must be at least ₱100.",path:["monthlyRent"]});if(v.listingPurpose==="sale"&&v.salePrice<1000)ctx.addIssue({code:"custom",message:"Sale price must be at least ₱1,000.",path:["salePrice"]});});
export async function GET(request:Request) {
  try {
    const account=await nativeAccount(request);if(!account)return reply({message:"Please sign in."},401);if(account.role!=="landlord")return reply({message:"A property-owner account is required."},403);
    const rows=await nativeDb().query(`SELECT l.id,l.title,l.slug,l.status,l.description,l.property_type AS "propertyType",l.listing_purpose AS "listingPurpose",l.sale_price_centavos::float8 AS "salePriceCentavos",l.city,l.province,l.barangay,l.latitude,l.longitude,l.monthly_rent_centavos AS "monthlyRentCentavos",COALESCE((SELECT json_agg(storage_key ORDER BY display_order) FROM listing_images WHERE listing_id=l.id),'[]'::json) AS "photoUrls" FROM listings l JOIN owner_profiles o ON o.id=l.owner_id WHERE o.user_id=$1 ORDER BY l.created_at DESC LIMIT 100`,[account.id]);
    return reply({listings:rows});
  }catch {return reply({message:"Your listings are temporarily unavailable."},503);}
}
export async function POST(request:Request) {
  try {
    const account=await nativeAccount(request);if(!account)return reply({message:"Please sign in."},401);if(account.role!=="landlord")return reply({message:"A property-owner account is required."},403);
    if(Number(request.headers.get("content-length")||0)>15000)return reply({message:"Request too large."},413);
    const raw=await request.json();const parsed=propertyInputSchema.safeParse({...raw,ownerContactKind:"none",ownerContactValue:""});if(!parsed.success)return reply({message:parsed.error.issues[0]?.message||"Check the property details."},400);
    const v=parsed.data;if(!await consumeRateLimit("native-listing",account.id,10,3600))return reply({message:"Submission limit reached. Try later."},429);
    const db=nativeDb();await db.query("INSERT INTO owner_profiles(user_id,public_name) VALUES($1,$2) ON CONFLICT(user_id) DO NOTHING",[account.id,account.displayName||"Property owner"]);
    const id=randomUUID(),slug=generateSlug(v.title,id.replaceAll("-",""));
    const rows=await db.query(`WITH created AS (INSERT INTO listings(id,owner_id,slug,title,description,property_type,listing_purpose,sale_price_centavos,rental_mode,status,city,barangay,latitude,longitude,monthly_rent_centavos,bedrooms,bathrooms,available_slots,furnished,owner_contact_kind,owner_contact_value,last_confirmed_at,province,published_at) SELECT $1::uuid,o.id,$2,$3,$4,$5,$6,$7,$8,'published',$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,now(),$21,now() FROM owner_profiles o WHERE o.user_id=$20 RETURNING id) INSERT INTO platform_events(actor_user_id,kind,listing_id) SELECT $20,'listing.submitted',id FROM created RETURNING listing_id`,[id,slug,v.title,v.description,v.propertyType,v.listingPurpose,v.listingPurpose==="sale"?Math.round((v.salePrice||0)*100):null,v.rentalMode,v.city,v.barangay,v.latitude,v.longitude,v.listingPurpose==="rent"?Math.round(v.monthlyRent*100):0,v.bedrooms===""?null:v.bedrooms,v.bathrooms===""?null:v.bathrooms,v.availableSlots===""?null:v.availableSlots,v.furnished,v.ownerContactKind,v.ownerContactKind==="none"?null:v.ownerContactValue,account.id,v.province]);
    if(!rows.length)return reply({message:"Unable to publish this property."},503);return reply({message:v.listingPurpose==="sale"?"Your property is now listed for sale.":"Your rental is published and can now appear in search.",id,slug},201);
  }catch {return reply({message:"Submission unavailable. Please try again."},503);}
}
export async function PATCH(request:Request) {
  try {
    const account=await nativeAccount(request);if(!account)return reply({message:"Please sign in."},401);if(account.role!=="landlord")return reply({message:"A property-owner account is required."},403);
    const body=await request.json(),db=nativeDb();
    if(body.action==="publish") {const input=z.object({id:z.string().uuid()}).safeParse(body);if(!input.success)return reply({message:"Choose a valid property."},400);const rows=await db.query(PUBLISH_OWNER_RENTAL,[account.id,input.data.id]);return rows.length?reply({message:"Property is live again."}):reply({message:"Property is not owned by you or cannot be published."},409);}
    if(body.action==="pause") {const input=z.object({id:z.string().uuid()}).safeParse(body);if(!input.success)return reply({message:"Choose a valid property."},400);const rows=await db.query(`UPDATE listings l SET status='paused',updated_at=now() FROM owner_profiles o WHERE l.owner_id=o.id AND o.user_id=$1 AND l.id=$2::uuid AND l.status='published' RETURNING l.id`,[account.id,input.data.id]);return rows.length?reply({message:"Property marked unavailable."}):reply({message:"Property is not currently available."},409);}
    if(body.action==="update") {const parsed=ownerEdit.safeParse(body);if(!parsed.success)return reply({message:parsed.error.issues[0]?.message||"Check the property details."},400);const v=parsed.data;const rows=await db.query(`UPDATE listings l SET title=$3,description=$4,property_type=$5,listing_purpose=$6,sale_price_centavos=$7,rental_mode=CASE WHEN $5='bedspace' THEN 'per_bed' ELSE 'whole_unit' END,city=$8,province=$9,barangay=$10,monthly_rent_centavos=$11,latitude=COALESCE($12,l.latitude),longitude=COALESCE($13,l.longitude),last_confirmed_at=now(),updated_at=now() FROM owner_profiles o WHERE l.owner_id=o.id AND o.user_id=$1 AND l.id=$2::uuid RETURNING l.id`,[account.id,v.id,v.title,v.description,v.propertyType,v.listingPurpose,v.listingPurpose==="sale"?Math.round(v.salePrice*100):null,v.city,v.province,v.barangay,v.listingPurpose==="rent"?Math.round(v.monthlyRent*100):0,v.latitude??null,v.longitude??null]);return rows.length?reply({message:"Property listing updated."}):reply({message:"Property not found."},404);}
    const parsed=z.object({id:z.string().uuid(),latitude:z.number().min(-90).max(90),longitude:z.number().min(-180).max(180)}).safeParse(body);if(!parsed.success)return reply({message:"Select a valid property map pin."},400);
    const rows=await db.query(UPDATE_OWNER_PIN,[parsed.data.latitude,parsed.data.longitude,account.id,parsed.data.id]);return rows.length?reply({message:"Property location updated."}):reply({message:"Property not found or not owned by your account."},404);
  }catch {return reply({message:"Listing update unavailable."},503);}
}
