import "server-only";
import { createHash, createHmac, randomBytes, randomInt, randomUUID, scrypt as nodeScrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import { neon } from "@neondatabase/serverless";
import { emailSchema, signInSchema } from "@/lib/auth-validation";

const scrypt = promisify(nodeScrypt);
const sessionReady = () => Boolean(process.env.DATABASE_URL && process.env.AUTH_SECRET);

export function emailSignUpConfigured() {
  return Boolean(emailPasswordSignInConfigured() && process.env.ENABLE_EMAIL_SIGNUP === "true" &&
    process.env.RESEND_API_KEY && process.env.AUTH_EMAIL_FROM && process.env.APP_BASE_URL);
}
export function emailPasswordSignInConfigured() { return sessionReady() && process.env.ENABLE_EMAIL_PASSWORD_AUTH === "true"; }
export function googleSignInConfigured() {
  return Boolean(sessionReady() && process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET);
}
function database() {
  if (!process.env.DATABASE_URL) throw Error("Database not configured");
  return neon(process.env.DATABASE_URL);
}
function stableKey(kind:string, subject:string) {
  return createHmac("sha256",process.env.AUTH_SECRET || "not-configured").update(kind+":"+subject).digest("hex");
}
const hashToken = (value:string) => createHash("sha256").update(value).digest("hex");
const randomToken = () => randomBytes(32).toString("base64url");
const escapeHtml = (value:string) => value.replace(/[&<>"']/g,c=>({
 "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"
})[c] || "");
function applicationOrigin() {
  const url=new URL(process.env.APP_BASE_URL || "https://invalid.local");
  if ((url.protocol !== "https:" && !(url.protocol==="http:" && url.hostname==="localhost")) ||
      url.username || url.password) throw Error("Invalid APP_BASE_URL");
  return url.origin;
}
async function sendEmail(to:string,subject:string,url:string,description:string) {
  if (!emailSignUpConfigured()) throw Error("Email delivery disabled");
  const response=await fetch("https://api.resend.com/emails",{
    method:"POST",cache:"no-store",
    headers:{"Authorization":"Bearer "+process.env.RESEND_API_KEY,"Content-Type":"application/json"},
    body:JSON.stringify({from:process.env.AUTH_EMAIL_FROM,to:[to],subject,
      html:'<div style="font-family:Arial,sans-serif;max-width:520px;margin:auto;color:#173d32"><h1>HomeTayo</h1><p>Use the link below to '+escapeHtml(description)+'. It expires soon.</p><p><a href="'+escapeHtml(url)+'" style="background:#173d32;color:white;padding:12px 20px;display:inline-block;border-radius:8px;text-decoration:none">Continue to HomeTayo</a></p><p>Didn’t request this? Ignore this email.</p></div>'})
  });
  if (!response.ok) throw Error("Email could not be delivered");
}
/** Atomic rate limit in Neon, by HMAC-obscured account/action, with rolling window. */
export async function consumeRateLimit(kind:string,subject:string,maximum:number,seconds:number):Promise<boolean>{
  if (!sessionReady()) return false;
  const db=database();
  const rows=await db.query(
    "INSERT INTO auth_rate_limits (key,attempts,window_started_at) VALUES ($1,1,now()) "+
    "ON CONFLICT (key) DO UPDATE SET "+
    "attempts=CASE WHEN auth_rate_limits.window_started_at < now()-$2*interval '1 second' THEN 1 ELSE auth_rate_limits.attempts+1 END, "+
    "window_started_at=CASE WHEN auth_rate_limits.window_started_at < now()-$2*interval '1 second' THEN now() ELSE auth_rate_limits.window_started_at END "+
    "RETURNING attempts", [stableKey(kind,subject),seconds]);
  return Number(rows[0]?.attempts ?? 999)<=maximum;
}
async function hashPassword(password:string):Promise<string>{
  const salt=randomBytes(16).toString("base64url");
  const derived=await scrypt(password,salt,64) as Buffer;
  return "scrypt-v1:"+salt+":"+derived.toString("base64url");
}
async function verifyPassword(password:string,stored?:string):Promise<boolean>{
  const chunks=stored?.split(":");
  const salt=chunks?.length===3 && chunks[0]==="scrypt-v1"?chunks[1]:"hometayo-auth-placeholder-salt";
  const actual=await scrypt(password,salt,64) as Buffer;
  if (!chunks || chunks.length!==3 || chunks[0]!=="scrypt-v1") return false;
  const expected=Buffer.from(chunks[2],"base64url");
  return expected.length===actual.length && timingSafeEqual(expected,actual);
}
export async function authenticateEmailPassword(rawEmail:unknown,rawPassword:unknown){
  if (!emailPasswordSignInConfigured()) return null;
  const validated=signInSchema.safeParse({email:rawEmail,password:rawPassword});
  if (!validated.success) return null;
  const {email,password}=validated.data;
  try {
    if (!await consumeRateLimit("login",email,8,15*60)) return null;
    const rows=await database().query(
      "SELECT u.id,u.email,u.display_name,c.password_hash FROM users u "+
      "INNER JOIN email_password_credentials c ON c.user_id=u.id "+
      "WHERE u.email=$1 AND c.verified_at IS NOT NULL LIMIT 1",[email]);
    const account=rows[0];
    const valid=await verifyPassword(password,account?.password_hash as string|undefined);
    if (!valid || typeof account?.id!=="string" || !account.id.startsWith("email:")) return null;
    return {id:account.id as string,email:account.email as string,name:account.display_name as string|null};
  } catch {
    console.error("HomeTayo email sign-in database unavailable");
    return null;
  }
}
async function issueEmailToken(id:string,email:string,purpose:"verify"|"reset"):Promise<void>{
  const db=database();
  const value=randomToken(),digest=hashToken(value);
  const lifetime=purpose==="verify"?86400:1800;
  // Existing tokens are invalidated whenever a new one is issued.
  await db.query("DELETE FROM auth_email_tokens WHERE user_id=$1 AND purpose=$2",[id,purpose]);
  await db.query("INSERT INTO auth_email_tokens (token_hash,user_id,purpose,expires_at) "+
    "VALUES ($1,$2,$3,now()+$4*interval '1 second')",[digest,id,purpose,lifetime]);
  const path=purpose==="verify"?"/verify-email?token=":"/reset-password?token=";
  await sendEmail(email,purpose==="verify"?"Verify your HomeTayo email":"Reset your HomeTayo password",
    applicationOrigin()+path+encodeURIComponent(value),
    purpose==="verify"?"verify your email address":"reset your password");
}
export async function registerEmailUser(email:string,name:string,password:string,delivery:"web"|"native"="web"):Promise<void>{
  if (!emailSignUpConfigured()) throw Error("Email registration disabled");
  if (!await consumeRateLimit("signup",email,3,24*3600)) return;
  const db=database();
  const found=await db.query(
    "SELECT u.id,c.password_hash,c.verified_at FROM users u "+
    "LEFT JOIN email_password_credentials c ON c.user_id=u.id WHERE u.email=$1 LIMIT 1",[email]);
  const entry=found[0];
  if (entry) {
    if (entry.verified_at || !entry.password_hash || !String(entry.id).startsWith("email:")) return;
    if (await verifyPassword(password,entry.password_hash as string)){
      if(delivery==="native") await issueNativeEmailCode(entry.id as string,email);
      else await issueEmailToken(entry.id as string,email,"verify");
    }
    return;
  }
  const id="email:"+randomUUID(),passwordHash=await hashPassword(password);
  const inserted=await db.query(
    "WITH created AS (INSERT INTO users (id,email,display_name,role) VALUES ($1,$2,$3,'renter') "+
    "ON CONFLICT (email) DO NOTHING RETURNING id) "+
    "INSERT INTO email_password_credentials (user_id,password_hash) "+
    "SELECT id,$4 FROM created RETURNING user_id",[id,email,name,passwordHash]);
  if (inserted.length) {
    if(delivery==="native") await issueNativeEmailCode(id,email);
    else await issueEmailToken(id,email,"verify");
  }
}
async function issueNativeEmailCode(id:string,email:string) {
  const code=String(randomInt(0,1000000)).padStart(6,"0");
  const db=database();
  await db.query("DELETE FROM auth_email_tokens WHERE user_id=$1 AND purpose='verify'",[id]);
  await db.query("INSERT INTO auth_email_tokens(token_hash,user_id,purpose,expires_at) VALUES($1,$2,'verify',now()+interval '10 minutes')",[stableKey("native-verify",email+":"+code),id]);
  const response=await fetch("https://api.resend.com/emails",{method:"POST",headers:{Authorization:"Bearer "+process.env.RESEND_API_KEY,"Content-Type":"application/json"},body:JSON.stringify({from:process.env.AUTH_EMAIL_FROM,to:[email],subject:"Your HomeTayo verification code",html:"<h1>HomeTayo</h1><p>Enter this code in the HomeTayo app:</p><h2>"+code+"</h2><p>Expires in 10 minutes. If you didn’t request it, ignore this email.</p>"})});
  if(!response.ok)throw Error("Verification email unavailable");
}
export async function verifyNativeEmailCode(rawEmail:string,code:string) {
  const parsed=emailSchema.safeParse(rawEmail);
  if(!parsed.success || !/^\d{6}$/.test(code) || !await consumeRateLimit("native-verify",parsed.data,5,900))return false;
  const rows=await database().query("WITH claimed AS (DELETE FROM auth_email_tokens WHERE token_hash=$1 AND purpose='verify' AND expires_at>now() RETURNING user_id) UPDATE email_password_credentials c SET verified_at=now() FROM claimed JOIN users u ON u.id=claimed.user_id WHERE c.user_id=claimed.user_id AND u.email=$2 AND c.verified_at IS NULL RETURNING c.user_id",[stableKey("native-verify",parsed.data+":"+code),parsed.data]);
  return rows.length>0;
}
export async function verifyEmailToken(value:string):Promise<boolean>{
  if (!sessionReady() || !/^[A-Za-z0-9_-]{40,60}$/.test(value)) return false;
  const rows=await database().query(
    "WITH claimed AS (DELETE FROM auth_email_tokens WHERE token_hash=$1 "+
    "AND purpose='verify' AND expires_at>now() RETURNING user_id) "+
    "UPDATE email_password_credentials c SET verified_at=now() "+
    "FROM claimed WHERE c.user_id=claimed.user_id AND c.verified_at IS NULL RETURNING c.user_id",
    [hashToken(value)]);
  return rows.length>0;
}
export async function requestPasswordReset(rawEmail:string):Promise<void>{
  if (!emailSignUpConfigured()) throw Error("Password recovery disabled");
  const parsed=emailSchema.safeParse(rawEmail);
  if (!parsed.success) return;
  const email=parsed.data;
  if (!await consumeRateLimit("password-reset",email,3,3600)) return;
  const rows=await database().query(
    "SELECT u.id FROM users u JOIN email_password_credentials c ON u.id=c.user_id "+
    "WHERE u.email=$1 AND c.verified_at IS NOT NULL AND u.id LIKE 'email:%' LIMIT 1",[email]);
  if (rows.length) await issueEmailToken(rows[0].id as string,email,"reset");
}
export async function resetEmailPassword(value:string,password:string):Promise<boolean>{
  if (!sessionReady() || !/^[A-Za-z0-9_-]{40,60}$/.test(value)) return false;
  const passwordHash=await hashPassword(password);
  const rows=await database().query(
    "WITH claimed AS (DELETE FROM auth_email_tokens "+
    "WHERE token_hash=$1 AND purpose='reset' AND expires_at>now() RETURNING user_id) "+
    "UPDATE email_password_credentials c SET password_hash=$2,password_updated_at=now() "+
    "FROM claimed WHERE c.user_id=claimed.user_id AND c.verified_at IS NOT NULL RETURNING c.user_id",
    [hashToken(value),passwordHash]);
  if(rows.length && process.env.ENABLE_NATIVE_AUTH==="true")await database().query("DELETE FROM native_sessions WHERE user_id=$1",[rows[0].user_id]);
  return rows.length>0;
}
