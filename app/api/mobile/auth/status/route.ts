import {NextResponse} from "next/server";
import {nativeReady} from "@/lib/native-auth";
import {emailPasswordSignInConfigured,emailSignUpConfigured} from "@/lib/email-auth";
export const dynamic="force-dynamic";
/** Public feature availability only; no credentials or database calls. */
export function GET(){
  const ready=nativeReady();
  return NextResponse.json({emailSignIn:ready&&emailPasswordSignInConfigured(),emailSignUp:ready&&emailSignUpConfigured(),google:ready&&Boolean(process.env.AUTH_GOOGLE_ID)}, {headers:{"Cache-Control":"no-store"}});
}
