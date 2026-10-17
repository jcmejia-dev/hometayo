import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { nativeAccount, nativeDb } from "@/lib/native-auth";
import { consumeRateLimit } from "@/lib/email-auth";
import { generateSlug, propertyInputSchema } from "@/lib/property-validation";
import { z } from "zod";
import {UPDATE_OWNER_PIN} from "@/lib/native-listing-policy";
export const dynamic="force-dynamic";
const reply=(body:unknown,status=200)=>NextResponse.json(body,{status,headers:{"Cache-Control":"no-store"}});
export async function GET(request:Request) {
  try {
    const account=await nativeAccount(request);
    if(!account)return reply({message:"Please sign in."},401);
    if(account.role!=="landlord")return reply({message:"A property-owner account is required."},403);
    const rows=await nativeDb().query("SELECT l.id,l.title,l.slug,l.status,l.city,l.barangay,l.latitude,l.longitude,l.monthly_rent_centavos AS \"monthlyRentCentavos\" FROM listings l JOIN owner_profiles o ON o.id=l.owner_id WHERE o.user_id=$1 ORDER BY l.created_at DESC LIMIT 100",[account.id]);
    return reply({listings:rows});
  }catch {return reply({message:"Your listings are temporarily unavailable."},503);}
}
export async function POST(request:Request) {
  try {
    const account=await nativeAccount(request);
    if(!account)return reply({message:"Please sign in."},401);
    if(account.role!=="landlord")return reply({message:"A property-owner account is required."},403);
    if(Number(request.headers.get("content-length")||0)>15000)return reply({message:"Request too large."},413);
    const raw=await request.json();
    const parsed=propertyInputSchema.safeParse({...raw,ownerContactKind:"none",ownerContactValue:""});
    if(!parsed.success)return reply({message:parsed.error.issues[0]?.message||"Check the rental details."},400);
    const v=parsed.data;
    if(!await consumeRateLimit("native-listing",account.id,10,3600))return reply({message:"Submission limit reached. Try later."},429);
    const db=nativeDb();
    await db.query("INSERT INTO owner_profiles(user_id,public_name) VALUES($1,$2) ON CONFLICT(user_id) DO NOTHING",[account.id,account.displayName||"Property owner"]);
    const id=randomUUID(),slug=generateSlug(v.title,id.replaceAll("-",""));
    const rows=await db.query(`WITH created AS (
      INSERT INTO listings(id,owner_id,slug,title,description,property_type,rental_mode,status,city,barangay,latitude,longitude,monthly_rent_centavos,bedrooms,bathrooms,available_slots,furnished,owner_contact_kind,owner_contact_value,last_confirmed_at,province)
      SELECT $1::uuid,o.id,$2,$3,$4,$5,$6,'pending_review',$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,now(),$19 FROM owner_profiles o WHERE o.user_id=$18 RETURNING id
    ) INSERT INTO platform_events(actor_user_id,kind,listing_id) SELECT $18,'listing.submitted',id FROM created RETURNING listing_id`,[id,slug,v.title,v.description,v.propertyType,v.rentalMode,v.city,v.barangay,v.latitude,v.longitude,v.monthlyRent*100,v.bedrooms===""?null:v.bedrooms,v.bathrooms===""?null:v.bathrooms,v.availableSlots===""?null:v.availableSlots,v.furnished,v.ownerContactKind,v.ownerContactKind==="none"?null:v.ownerContactValue,account.id,v.province]);
    if(!rows.length)return reply({message:"Unable to submit this rental."},503);
    return reply({message:"Submitted for administrator review. Your rental is not public yet."},201);
  }catch {return reply({message:"Submission unavailable. Please try again."},503);}
}
export async function PATCH(request:Request) {
  try {
    const account=await nativeAccount(request);
    if(!account)return reply({message:"Please sign in."},401);
    if(account.role!=="landlord")return reply({message:"A property-owner account is required."},403);
    const parsed=z.object({id:z.uuid(),latitude:z.number().min(-90).max(90),longitude:z.number().min(-180).max(180)}).safeParse(await request.json());
    if(!parsed.success)return reply({message:"Select a valid property map pin."},400);
    if(!await consumeRateLimit("native-pin",account.id,20,3600))return reply({message:"Pin update limit reached."},429);
    const {id,latitude,longitude}=parsed.data;
    const rows=await nativeDb().query(UPDATE_OWNER_PIN,[latitude,longitude,account.id,id]);
    return rows.length?reply({message:"Pin updated and submitted for review."}):reply({message:"Rental not found or not owned by your account."},404);
  }catch {return reply({message:"Pin update unavailable."},503);}
}
