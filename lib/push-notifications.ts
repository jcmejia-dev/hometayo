import "server-only";
import {neon} from "@neondatabase/serverless";

const TOKEN=/^(?:Exponent|Expo)PushToken\[[A-Za-z0-9_-]+\]$/;
function db(){if(!process.env.DATABASE_URL)throw Error("Database unavailable.");return neon(process.env.DATABASE_URL);}
type PushData=Record<string,string|number|boolean|null|undefined>;

async function sendExpo(userId:string,title:string,body:string,data:PushData,channelId="rentals"){
 const sql=db();
 const tokens=await sql.query(`SELECT token FROM mobile_push_tokens WHERE user_id=$1`,[userId]) as Array<{token:string}>;
 const clean=body.replace(/\s+/g," ").trim();
 const payload=tokens.filter(x=>TOKEN.test(x.token)).map(x=>({
  to:x.token,title,body:clean.length>170?clean.slice(0,167)+"…":clean,data,priority:"high",sound:"default",channelId,ttl:86400,
 }));
 if(!payload.length)return false;
 const response=await fetch("https://exp.host/--/api/v2/push/send",{method:"POST",headers:{"Content-Type":"application/json","Accept":"application/json"},body:JSON.stringify(payload)});
 return response.ok;
}

export async function registerMobilePushToken(userId:string,token:string,platform="android"){
 if(!TOKEN.test(token))throw Error("Invalid Expo push token.");
 const sql=db();
 await sql.query(`INSERT INTO mobile_push_tokens(token,user_id,platform,updated_at) VALUES($1,$2,$3,now())
  ON CONFLICT(token) DO UPDATE SET user_id=excluded.user_id,platform=excluded.platform,updated_at=now()`,[token,userId,platform]);
}

export async function removeMobilePushTokens(userId:string){await db().query(`DELETE FROM mobile_push_tokens WHERE user_id=$1`,[userId]);}

export async function sendConversationPush(senderId:string,conversationId:string,body:string){
 try{
  const sql=db();
  const meta=await sql.query(`SELECT CASE WHEN c.owner_id=$1 THEN c.renter_id ELSE c.owner_id END AS recipient_id,
   COALESCE(u.preferred_name,u.display_name,'HomeTayo user') AS sender_name,l.title
   FROM rental_conversations c JOIN users u ON u.id=$1 JOIN listings l ON l.id=c.listing_id
   WHERE c.id=$2::uuid AND $1 IN(c.owner_id,c.renter_id)`,[senderId,conversationId]) as Array<{recipient_id:string;sender_name:string;title:string}>;
  const row=meta[0];if(!row)return;
  await sendExpo(row.recipient_id,row.sender_name,body,{type:"message",screen:"messages",conversationId,propertyTitle:row.title},"messages");
 }catch{
  // A push failure must never prevent the Neon-backed chat message from being saved.
 }
}

const lifecycleTitle=(kind:string)=>({
 offer:"Rental offer",rental_request:"Rental request",reservation:"Reservation update",payment_proof:"Payment verification",tenancy:"Tenancy update",payment:"Payment update",reminder:"Rent reminder",
 maintenance:"Maintenance update",document:"Rental document",review:"Rental review",
}[kind]||"HomeTayo rental update");
const lifecycleSection=(kind:string)=>({offer:"offer",reservation:"reservation",payment_proof:"payments",payment:"payments",reminder:"payments",maintenance:"maintenance",document:"documents",review:"reviews",tenancy:"tenancy",rental_request:"agreement"}[kind]||"rental");

export async function dispatchPendingRentalPushes(){
 try{
  const sql=db();
  const rows=await sql.query(`SELECT n.id,n.user_id AS "userId",n.conversation_id AS "conversationId",n.kind,n.body,
    COALESCE(l.title,'Your rental') AS "propertyTitle"
   FROM rental_notifications n
   LEFT JOIN rental_conversations c ON c.id=n.conversation_id
   LEFT JOIN listings l ON l.id=COALESCE(n.listing_id,c.listing_id)
   WHERE n.push_sent_at IS NULL AND n.kind<>'message' AND n.created_at>now()-interval '14 days'
   ORDER BY n.created_at ASC LIMIT 50`) as Array<{id:string;userId:string;conversationId:string|null;kind:string;body:string;propertyTitle:string}>;
  for(const row of rows){
   const inConversation=Boolean(row.conversationId);
   const delivered=await sendExpo(row.userId,lifecycleTitle(row.kind),row.body,{type:"rental",screen:inConversation?"messages":"rental",conversationId:row.conversationId||"",notificationId:row.id,kind:row.kind,section:lifecycleSection(row.kind),propertyTitle:row.propertyTitle},row.kind==="offer"?"messages":"rentals");
   if(delivered)await sql.query(`UPDATE rental_notifications SET push_sent_at=now() WHERE id=$1::uuid AND push_sent_at IS NULL`,[row.id]);
  }
 }catch{
  // Lifecycle push delivery is best-effort; in-app notifications remain authoritative.
 }
}
