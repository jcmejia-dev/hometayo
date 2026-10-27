import "server-only";
import {neon} from "@neondatabase/serverless";
import {rentalOperation,type RentalOperation} from "./rental-operation-input";
import * as q from "./rental-operation-sql";
import * as social from "./rental-social-sql";
import {END_TENANCY_V2} from "./rental-lifecycle-compat";
import {uuidInput} from "./rental-unit-input";
import type {Conversation,OperationsState,Notice} from "./rental-operation-types";
import {dispatchPendingRentalPushes,sendConversationPush} from "./push-notifications";
import {emptyLifecycleState,isLifecycleOperation,lifecycleState,performLifecycleOperation} from "./rental-lifecycle";

function client(){if(process.env.ENABLE_RENTAL_MANAGEMENT!=="true"||!process.env.DATABASE_URL)throw Error("Rental management is awaiting setup.");return neon(process.env.DATABASE_URL);}
function validGifUrl(value:string){try{const url=new URL(value);return url.protocol==="https:"&&!url.username&&!url.password;}catch{return false;}}
async function markDelivered(db:ReturnType<typeof client>,userId:string){try{await db.query(social.MARK_DELIVERED,[userId]);}catch{/* Migration 010 may still be rolling out. */}}

// Kept in the parser for backwards compatibility with older Android builds, but no
// longer exposed as a second way to create a rental commitment. All new rentals
// must agree terms through the offer flow in Messages.
export const LEGACY_COMMITMENT_ACTIONS=new Set(["invite","accept","decline","requestRent","cancelRentRequest","approveRentRequest","declineRentRequest"] as const);

export function operationQuery(userId:string,v:RentalOperation):{sql:string;args:unknown[]}{
 switch(v.action){
  case "inquire":return {sql:q.INQUIRE,args:[userId,v.slug]};
  case "message":return {sql:social.MESSAGE_V2,args:[userId,v.conversationId,v.eventId,v.body,v.replyToId??null,v.mediaType]};
  case "typing":return {sql:social.TYPING,args:[userId,v.conversationId]};
  case "messageReact":return {sql:v.emoji==="none"?social.MESSAGE_UNREACT:social.MESSAGE_REACT,args:v.emoji==="none"?[userId,v.messageId]:[userId,v.messageId,v.emoji]};
  case "read":return {sql:social.READ_NOTICE_V2,args:[userId,v.notificationId]};
  case "invite":return {sql:q.INVITE,args:[userId,v.conversationId,v.unitId,v.monthlyRent,v.startsOn]};
  case "accept":return {sql:q.ACCEPT,args:[userId,v.tenancyId]};
  case "decline":return {sql:q.DECLINE,args:[userId,v.tenancyId]};
  case "end":return {sql:END_TENANCY_V2,args:[userId,v.tenancyId,v.endedOn]};
  case "charge":return {sql:q.CHARGE,args:[userId,v.tenancyId,v.dueOn,v.description,v.amount]};
  case "payment":return {sql:q.PAYMENT,args:[userId,v.chargeId,v.eventId,v.amount,v.paidOn,v.note]};
  case "void":return {sql:q.VOID_PAYMENT,args:[userId,v.paymentId,v.reason]};
  case "voidCharge":return {sql:q.VOID_CHARGE,args:[userId,v.chargeId,v.reason]};
  case "remind":return {sql:q.REMIND,args:[userId,v.chargeId]};
  case "react":return {sql:v.kind==="none"?q.UNREACT:q.REACT,args:v.kind==="none"?[userId,v.slug]:[userId,v.slug,v.kind]};
  default:throw Error("This rental action uses the lifecycle service.");
 }
}

export async function performOperation(userId:string,body:unknown){
 const v=rentalOperation.parse(body);
 if(LEGACY_COMMITMENT_ACTIONS.has(v.action as never))throw Error("Start and agree to this rental through Offer & negotiate in Messages. Existing reservations and tenancies remain manageable from the conversation.");
 if(v.action==="message"&&v.mediaType==="gif"&&!validGifUrl(v.body))throw Error("Use a valid HTTPS GIF URL.");
 if(isLifecycleOperation(v))return performLifecycleOperation(userId,v);
 const query=operationQuery(userId,v),db=client();let rows:Record<string,unknown>[];
 try{rows=await db.query(query.sql,query.args) as Record<string,unknown>[];}
 catch(error){
  if(v.action==="message")rows=await db.query(q.MESSAGE,[userId,v.conversationId,v.eventId,v.body]) as Record<string,unknown>[];
  else if(v.action==="typing")rows=await db.query(social.TYPING_LEGACY,[userId,v.conversationId]) as Record<string,unknown>[];
  else if(v.action==="read")rows=await db.query(q.READ_NOTICE,[userId,v.notificationId]) as Record<string,unknown>[];
  else if(v.action==="messageReact")throw Error("Message reactions are being enabled. Please try again after the latest database update.");
  else throw error;
 }
 if(v.action==="message"&&rows.length)await sendConversationPush(userId,v.conversationId,v.mediaType==="gif"?"Sent a GIF":v.body);
 if(v.action==="react"&&v.kind!=="none"&&rows.length){
  try{await db.query(`INSERT INTO rental_notifications(user_id,conversation_id,listing_id,kind,body,event_key)
   SELECT o.user_id,NULL,l.id,'reaction',COALESCE(u.preferred_name,u.display_name,'Someone')||' '||CASE $3 WHEN 'like' THEN 'liked' WHEN 'love' THEN 'loved' ELSE 'is interested in' END||' your listing','reaction:'||l.id::text||':'||$1
   FROM listings l JOIN owner_profiles o ON o.id=l.owner_id JOIN users u ON u.id=$1 WHERE l.slug=$2 AND o.user_id<>$1
   ON CONFLICT(event_key) DO UPDATE SET body=excluded.body,read_at=NULL,created_at=now(),listing_id=excluded.listing_id`,[userId,v.slug,v.kind]);}catch{/* Reaction itself remains saved while migration 008 is rolling out. */}
 }
 if(rows.length&&["end","charge","payment","void","voidCharge","remind"].includes(v.action))await dispatchPendingRentalPushes();
 if(!rows.length&&!["message","typing","messageReact","payment","charge","remind","read","react"].includes(v.action))throw Error("Action unavailable. Check access and current status.");
 return {id:rows[0]?.id as string|undefined,message:rows.length?"Saved.":"Already recorded, unavailable, or no change needed."};
}

export async function notificationState(userId:string):Promise<Notice[]>{
 const db=client();await markDelivered(db,userId);return await db.query(social.NOTICES_SOCIAL,[userId]) as Notice[];
}

export async function headerNotificationState(userId:string):Promise<{notifications:Notice[];conversations:Conversation[]}>{
 const db=client();await markDelivered(db,userId);const notifications=await db.query(social.NOTICES_SOCIAL,[userId]) as Notice[];let conversations:Conversation[];
 try{conversations=await db.query(social.CONVERSATIONS_SOCIAL,[userId]) as Conversation[];}catch{conversations=await db.query(q.CONVERSATIONS,[userId]) as Conversation[];}
 return {notifications,conversations};
}

export async function operationsState(userId:string,conversationId?:string,month?:string,before?:string):Promise<OperationsState>{
 const db=client();if(conversationId)uuidInput.parse(conversationId);if(before)uuidInput.parse(before);await markDelivered(db,userId);
 const parts=new Intl.DateTimeFormat("en",{timeZone:"Asia/Manila",year:"numeric",month:"2-digit"}).formatToParts(new Date());const selected=month&&/^\d{4}-(0[1-9]|1[0-2])$/.test(month)?month:`${parts.find(p=>p.type==="year")!.value}-${parts.find(p=>p.type==="month")!.value}`;
 let conversations:unknown[],messages:unknown[],typingRows:unknown[]=[];
 try{conversations=await db.query(social.CONVERSATIONS_SOCIAL,[userId]);}catch{conversations=await db.query(q.CONVERSATIONS,[userId]);}
 if(conversationId){
  try{messages=await db.query(social.THREAD_MESSAGES_SOCIAL,[userId,conversationId,before||null]);}catch{messages=await db.query(q.THREAD_MESSAGES_PAGE,[userId,conversationId,before||null]);}
  try{typingRows=await db.query(social.TYPING_STATE,[userId,conversationId]);}catch{typingRows=await db.query(social.TYPING_STATE_LEGACY,[userId,conversationId]);}
 }else messages=[];
 let lifecycle:null|Awaited<ReturnType<typeof lifecycleState>>=null;
 if(conversationId)try{lifecycle=await lifecycleState(userId,conversationId);}catch{/* Migration 011 may still be rolling out; legacy tenancy/ledger stays available. */}
 const [noticeRows,summary,legacyTenancies,legacyCharges,payments]=await Promise.all([
  db.query(social.NOTICES_SOCIAL,[userId]),db.query(q.SUMMARY,[userId,selected]),conversationId&&!lifecycle?db.query(q.TENANCIES,[userId,conversationId]):[],conversationId&&!lifecycle?db.query(q.CHARGES,[userId,conversationId]):[],conversationId?db.query(q.PAYMENTS,[userId,conversationId]):[],
 ]);
 const notifications=noticeRows as Notice[];const typing=Boolean((typingRows[0] as {typing?:boolean}|undefined)?.typing);
 return {
  conversations,notifications,summary:summary[0],messages:messages.reverse(),
  tenancies:lifecycle?.tenancies??legacyTenancies,charges:lifecycle?.charges??legacyCharges,payments,
  ...(lifecycle??emptyLifecycleState),month:selected,typing,
 } as OperationsState;
}

export async function reactionState(slug:string,userId?:string){if(process.env.ENABLE_RENTAL_MANAGEMENT!=="true")return {counts:[],mine:null};const db=client();const counts=await db.query(`SELECT r.kind,count(*)::int AS count FROM listing_reactions r JOIN listings l ON l.id=r.listing_id WHERE l.slug=$1 AND l.status='published' GROUP BY r.kind`,[slug]);const mine=userId?await db.query(`SELECT r.kind FROM listing_reactions r JOIN listings l ON l.id=r.listing_id WHERE l.slug=$1 AND l.status='published' AND r.user_id=$2`,[slug,userId]):[];return {counts,mine:mine[0]?.kind??null};}
