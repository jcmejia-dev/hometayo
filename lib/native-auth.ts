import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { neon } from "@neondatabase/serverless";
import { OAuth2Client } from "google-auth-library";
import { consumeRateLimit } from "@/lib/email-auth";
import {SESSION_LOOKUP} from "@/lib/native-auth-input";

export type NativeAccount = {id:string;email:string;displayName:string|null;role:string};
const digest=(value:string)=>createHash("sha256").update(value).digest("hex");
export function nativeReady() {return process.env.ENABLE_NATIVE_AUTH==="true" && Boolean(process.env.AUTH_SECRET && process.env.DATABASE_URL);}
export function nativeDb() {
  if(!nativeReady()) throw Error("Native accounts are not configured.");
  return neon(process.env.DATABASE_URL!);
}
export async function issueNativeSession(id:string) {
  const token=randomBytes(32).toString("base64url");
  const rows=await nativeDb().query("INSERT INTO native_sessions(token_hash,user_id,expires_at) VALUES($1,$2,now()+interval '7 days') RETURNING expires_at",[digest(token),id]);
  return {token,expiresAt:rows[0].expires_at};
}
export async function nativeAccount(request:Request):Promise<NativeAccount|null> {
  if(!nativeReady()) return null;
  const token=request.headers.get("authorization")?.match(/^Bearer ([A-Za-z0-9_-]{43})$/)?.[1];
  if(!token)return null;
  const rows=await nativeDb().query(SESSION_LOOKUP,[digest(token)]);
  return rows[0] as NativeAccount ?? null;
}
export async function revokeNativeSession(request:Request) {
  const token=request.headers.get("authorization")?.match(/^Bearer ([A-Za-z0-9_-]{43})$/)?.[1];
  if(token) await nativeDb().query("DELETE FROM native_sessions WHERE token_hash=$1",[digest(token)]);
}
export async function nativeGoogleAccount(idToken:string):Promise<NativeAccount|null> {
  const audience=process.env.AUTH_GOOGLE_ID;
  if(!audience || !nativeReady()) return null;
  const ticket=await new OAuth2Client(audience).verifyIdToken({idToken,audience}).catch(()=>null);
  if(!ticket)return null;
  const p=ticket.getPayload();
  if(!p?.sub || !p.email || !p.email_verified)return null;
  const id="google:"+p.sub;
  if(!await consumeRateLimit("native-google",id,10,900))return null;
  const rows=await nativeDb().query("INSERT INTO users(id,email,display_name) VALUES($1,$2,$3) ON CONFLICT(id) DO UPDATE SET display_name=excluded.display_name,updated_at=now() RETURNING id,email,display_name AS \"displayName\",role",[id,p.email.toLowerCase(),p.name?.slice(0,150) ?? null]);
  const saved=rows[0] as NativeAccount|undefined;
  return saved?.email===p.email.toLowerCase()?saved:null;
}
