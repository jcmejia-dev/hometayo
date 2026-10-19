import {publicAccountRole} from "@/lib/admin-policy";
import { NextResponse } from "next/server";
import { nativeAuthInput } from "@/lib/native-auth-input";
import { authenticateEmailPassword, emailPasswordSignInConfigured, emailSignUpConfigured, registerEmailUser, verifyNativeEmailCode } from "@/lib/email-auth";
import { issueNativeSession, nativeAccount, nativeDb, nativeGoogleAccount, nativeReady, revokeNativeSession } from "@/lib/native-auth";
import {removeMobilePushTokens} from "@/lib/push-notifications";

export const dynamic="force-dynamic";
const reply=(body:unknown,status=200)=>NextResponse.json(body,{status,headers:{"Cache-Control":"no-store"}});
export async function GET(request:Request) {
  if(!nativeReady()) return reply({message:"Native sign-in is awaiting setup."},503);
  try {const account=await nativeAccount(request);return account?reply({account}):reply({message:"Please sign in."},401);}
  catch {return reply({message:"Account service unavailable."},503);}
}
export async function POST(request:Request) {
  if(!nativeReady())return reply({message:"Native sign-in is awaiting setup."},503);
  if(Number(request.headers.get("content-length") || 0)>16000)return reply({message:"Request too large."},413);
  try {
    const parsed=nativeAuthInput.safeParse(await request.json());
    if(!parsed.success)return reply({message:"Please check your account details."},400);
    const data=parsed.data;
    if(data.action==="signup") {
      if(!emailSignUpConfigured())return reply({message:"Email registration is awaiting setup."},503);
      await registerEmailUser(data.email,data.name,data.password,"native",data.audience);
      return reply({message:"If this address is eligible, a six-digit verification code will arrive shortly."});
    }
    if(data.action==="verify") {
      return await verifyNativeEmailCode(data.email,data.code)?reply({message:"Email verified. Sign in to continue."}):reply({message:"Code invalid, expired, or too many attempts."},400);
    }
    if(data.action==="login" || data.action==="google") {
      if(data.action==="login" && !emailPasswordSignInConfigured())return reply({message:"Email sign-in is awaiting setup."},503);
      const result=data.action==="google" ? await nativeGoogleAccount(data.idToken,data.audience) : await authenticateEmailPassword(data.email,data.password);
      if(!result)return reply({message:"Sign-in failed. Check your details and email verification."},401);
      const rows=await nativeDb().query("SELECT id,email,COALESCE(preferred_name,display_name) AS \"displayName\",role FROM users WHERE id=$1",[result.id]);
      return reply({...await issueNativeSession(result.id),account:{...rows[0],role:publicAccountRole(rows[0].role)}});
    }
    const account=await nativeAccount(request);
    if(!account)return reply({message:"Please sign in again."},401);
    if(data.action==="logout") {await removeMobilePushTokens(account.id).catch(()=>{});await revokeNativeSession(request);return reply({ok:true});}
    const role=data.audience==="owner"?"landlord":"renter";
    if(role!==account.role)return reply({message:"Your account type was saved when you registered. Sign in with your existing account type."},409);
    return reply({account});
  } catch {return reply({message:"Account service unavailable. Try again later."},503);}
}
