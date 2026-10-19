import "server-only";
import { neon } from "@neondatabase/serverless";
import { NextResponse } from "next/server";
import { performOperation, operationsState } from "./rental-operations";
import { rentalOperation } from "./rental-operation-input";
import { consumeRateLimit } from "./email-auth";
const reply=(body:unknown,status=200)=>NextResponse.json(body,{status,headers:{"Cache-Control":"no-store"}});

const COMPATIBLE_INQUIRY=`WITH c AS (
 INSERT INTO rental_conversations(listing_id,owner_id,renter_id)
 SELECT l.id,o.user_id,$1 FROM listings l JOIN owner_profiles o ON o.id=l.owner_id
 JOIN users a ON a.id=$1 WHERE l.slug=$2 AND l.status='published'
 AND a.role IN ('renter','admin','moderator') AND o.user_id<>$1
 ON CONFLICT(listing_id,renter_id) DO UPDATE SET renter_id=excluded.renter_id RETURNING *
), n AS (INSERT INTO rental_notifications(user_id,conversation_id,kind,body,event_key)
 SELECT owner_id,id,'inquiry','New rental inquiry','inquiry:'||id FROM c ON CONFLICT(event_key) DO NOTHING)
 SELECT id FROM c`;

export async function operationGet(request:Request,userId:string|null){
 if(!userId)return reply({message:"Please sign in."},401);
 try {const p=new URL(request.url).searchParams;return reply(await operationsState(userId,p.get("conversationId")||undefined,p.get("month")||undefined,p.get("before")||undefined));}
 catch {return reply({message:"Rental management is unavailable. Check server setup and try again."},503);}
}
export async function operationPost(request:Request,userId:string|null){
 if(!userId)return reply({message:"Please sign in."},401);
 if(process.env.ENABLE_RENTAL_MANAGEMENT!=="true")return reply({message:"Rental management is awaiting setup."},503);
 let raw;try{raw=await request.text();}catch{return reply({message:"Invalid request."},400);}
 if(raw.length>6000)return reply({message:"Request too large."},413);
 let body;try{body=JSON.parse(raw);}catch{return reply({message:"Invalid request."},400);}
 if(!rentalOperation.safeParse(body).success)return reply({message:"Check your details, dates, and amounts."},400);
 try{
  if(!await consumeRateLimit("rental-operations",userId,60,60))return reply({message:"Please wait a moment before trying again."},429);
  if(body.action==="inquire"){
   if(!process.env.DATABASE_URL)return reply({message:"Messaging is temporarily unavailable."},503);
   const rows=await neon(process.env.DATABASE_URL).query(COMPATIBLE_INQUIRY,[userId,body.slug]) as Record<string,unknown>[];
   if(!rows.length)return reply({message:"You cannot message your own listing, or this rental is no longer available."},409);
   return reply({id:rows[0].id,message:"Saved."});
  }
  return reply(await performOperation(userId,body));
 }catch{return reply({message:"Could not save. Check permission, room availability, duplicate entries, and dates."},409);}
}
