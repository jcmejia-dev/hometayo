import "server-only";
import { neon } from "@neondatabase/serverless";
import { rentalOperation, type RentalOperation } from "./rental-operation-input";
import * as q from "./rental-operation-sql";
import { uuidInput } from "./rental-unit-input";
import type { OperationsState } from "./rental-operation-types";

function client(){
 if(process.env.ENABLE_RENTAL_MANAGEMENT!=="true"||!process.env.DATABASE_URL)throw Error("Rental management is awaiting setup.");
 return neon(process.env.DATABASE_URL);
}
export function operationQuery(userId:string,v:RentalOperation):{sql:string;args:unknown[]}{
 switch(v.action){
  case "inquire":return {sql:q.INQUIRE,args:[userId,v.slug]};
  case "message":return {sql:q.MESSAGE,args:[userId,v.conversationId,v.eventId,v.body]};
  case "read":return {sql:q.READ_NOTICE,args:[userId,v.notificationId]};
  case "invite":return {sql:q.INVITE,args:[userId,v.conversationId,v.unitId,v.monthlyRent,v.startsOn]};
  case "accept":return {sql:q.ACCEPT,args:[userId,v.tenancyId]};
  case "decline":return {sql:q.DECLINE,args:[userId,v.tenancyId]};
  case "end":return {sql:q.END_TENANCY,args:[userId,v.tenancyId,v.endedOn]};
  case "charge":return {sql:q.CHARGE,args:[userId,v.tenancyId,v.dueOn,v.description,v.amount]};
  case "payment":return {sql:q.PAYMENT,args:[userId,v.chargeId,v.eventId,v.amount,v.paidOn,v.note]};
  case "void":return {sql:q.VOID_PAYMENT,args:[userId,v.paymentId,v.reason]};
  case "voidCharge":return {sql:q.VOID_CHARGE,args:[userId,v.chargeId,v.reason]};
  case "remind":return {sql:q.REMIND,args:[userId,v.chargeId]};
  case "react":return {sql:v.kind==="none"?q.UNREACT:q.REACT,args:v.kind==="none"?[userId,v.slug]:[userId,v.slug,v.kind]};
 }
}
export async function performOperation(userId:string,body:unknown){
 const v=rentalOperation.parse(body), query=operationQuery(userId,v);
 const rows=await client().query(query.sql,query.args);
 // A replay is harmless. Other no-op results need a clear retry/access message.
 if(!rows.length && !["message","payment","charge","remind","read","react"].includes(v.action))throw Error("Action unavailable. Check access and current status.");
 return {id:rows[0]?.id as string|undefined,message:rows.length?"Saved.":"Already recorded, unavailable, or no change needed."};
}
export async function operationsState(userId:string,conversationId?:string,month?:string,before?:string):Promise<OperationsState>{
 const db=client();
 if(conversationId)uuidInput.parse(conversationId);
 if(before)uuidInput.parse(before);
 // Intl separators differ between runtimes; extract the parts explicitly.
 const parts=new Intl.DateTimeFormat("en",{timeZone:"Asia/Manila",year:"numeric",month:"2-digit"}).formatToParts(new Date());
 const selected=month&&/^\d{4}-(0[1-9]|1[0-2])$/.test(month)?month:`${parts.find(p=>p.type==="year")!.value}-${parts.find(p=>p.type==="month")!.value}`;
 const [conversations,notifications,summary,messages,tenancies,charges,payments]=await Promise.all([
  db.query(q.CONVERSATIONS,[userId]),db.query(q.NOTICES,[userId]),db.query(q.SUMMARY,[userId,selected]),
  conversationId?db.query(q.THREAD_MESSAGES_PAGE,[userId,conversationId,before||null]):[],conversationId?db.query(q.TENANCIES,[userId,conversationId]):[],
  conversationId?db.query(q.CHARGES,[userId,conversationId]):[],conversationId?db.query(q.PAYMENTS,[userId,conversationId]):[],
 ]);
 return {conversations,notifications,summary:summary[0],messages:messages.reverse(),tenancies,charges,payments,month:selected} as OperationsState;
}
export async function reactionState(slug:string,userId?:string){
 if(process.env.ENABLE_RENTAL_MANAGEMENT!=="true")return {counts:[],mine:null};
 const db=client();
 const counts=await db.query(`SELECT r.kind,count(*)::int AS count FROM listing_reactions r JOIN listings l ON l.id=r.listing_id WHERE l.slug=$1 AND l.status='published' GROUP BY r.kind`,[slug]);
 const mine=userId?await db.query(`SELECT r.kind FROM listing_reactions r JOIN listings l ON l.id=r.listing_id WHERE l.slug=$1 AND l.status='published' AND r.user_id=$2`,[slug,userId]):[];
 return {counts,mine:mine[0]?.kind??null};
}
