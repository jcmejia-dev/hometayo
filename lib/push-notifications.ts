import "server-only";
import {neon} from "@neondatabase/serverless";

const TOKEN=/^(?:Exponent|Expo)PushToken\[[A-Za-z0-9_-]+\]$/;

function db(){if(!process.env.DATABASE_URL)throw Error("Database unavailable.");return neon(process.env.DATABASE_URL);}

async function ensurePushTokens(){
 const sql=db();
 await sql.query(`CREATE TABLE IF NOT EXISTS mobile_push_tokens (
  token text PRIMARY KEY,
  user_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  platform text NOT NULL DEFAULT 'android',
  updated_at timestamptz NOT NULL DEFAULT now()
 )`);
 await sql.query(`CREATE INDEX IF NOT EXISTS mobile_push_tokens_user_idx ON mobile_push_tokens(user_id)`);
 return sql;
}

export async function registerMobilePushToken(userId:string,token:string,platform="android"){
 if(!TOKEN.test(token))throw Error("Invalid Expo push token.");
 const sql=await ensurePushTokens();
 await sql.query(`INSERT INTO mobile_push_tokens(token,user_id,platform,updated_at) VALUES($1,$2,$3,now())
  ON CONFLICT(token) DO UPDATE SET user_id=excluded.user_id,platform=excluded.platform,updated_at=now()`,[token,userId,platform]);
}

export async function sendConversationPush(senderId:string,conversationId:string,body:string){
 try{
  const sql=await ensurePushTokens();
  const meta=await sql.query(`SELECT CASE WHEN c.owner_id=$1 THEN c.renter_id ELSE c.owner_id END AS recipient_id,
   COALESCE(u.preferred_name,u.display_name,'HomeTayo user') AS sender_name,l.title
   FROM rental_conversations c JOIN users u ON u.id=$1 JOIN listings l ON l.id=c.listing_id
   WHERE c.id=$2::uuid AND $1 IN(c.owner_id,c.renter_id)`,[senderId,conversationId]) as Array<{recipient_id:string;sender_name:string;title:string}>;
  const row=meta[0];if(!row)return;
  const tokens=await sql.query(`SELECT token FROM mobile_push_tokens WHERE user_id=$1`,[row.recipient_id]) as Array<{token:string}>;
  if(!tokens.length)return;
  const clean=body.replace(/\s+/g," ").trim();
  const payload=tokens.filter(x=>TOKEN.test(x.token)).map(x=>({
   to:x.token,
   title:row.sender_name,
   body:clean.length>150?clean.slice(0,147)+"…":clean,
   data:{type:"message",conversationId,propertyTitle:row.title},
   priority:"high",
   channelId:"messages",
  }));
  if(!payload.length)return;
  await fetch("https://exp.host/--/api/v2/push/send",{method:"POST",headers:{"Content-Type":"application/json","Accept":"application/json"},body:JSON.stringify(payload)});
 }catch{
  // A push failure must never prevent the chat message itself from being saved.
 }
}
