"use server";

import { AuthError } from "next-auth";
import { redirect } from "next/navigation";
import { signIn } from "@/auth";
import { emailSchema, signInSchema, signUpSchema, resetSchema } from "@/lib/auth-validation";
import {
  emailSignUpConfigured, registerEmailUser, requestPasswordReset,
  verifyEmailToken, resetEmailPassword,
} from "@/lib/email-auth";

export type AuthFormState = { message: string; success?: boolean };
const empty = (v:FormData,key:string) => typeof v.get(key)==="string" ? String(v.get(key)) : "";

export async function loginWithEmail(_:AuthFormState,form:FormData):Promise<AuthFormState> {
  const result=signInSchema.safeParse({email:empty(form,"email"),password:empty(form,"password")});
  if (!result.success) return {message:"Enter a valid email and password."};
  try {
    await signIn("credentials",{
      email:result.data.email,password:result.data.password,redirectTo:"/account/start",
    });
    return {message:""};
  } catch(error) {
    if (error instanceof AuthError) return {message:"Invalid credentials, unverified email, or too many attempts. Try again later."};
    throw error; // Next.js redirect is control flow, never swallow it.
  }
}
export async function signUpWithEmail(_:AuthFormState,form:FormData):Promise<AuthFormState> {
  if (!emailSignUpConfigured()) return {message:"Email registration is not yet enabled. Please use Google sign-in."};
  const valid=signUpSchema.safeParse({
    name:empty(form,"name"),email:empty(form,"email"),
    password:empty(form,"password"),confirmPassword:empty(form,"confirmPassword"),
  });
  if (!valid.success) return {message:valid.error.issues[0]?.message || "Please check the fields."};
  try {
    await registerEmailUser(valid.data.email,valid.data.name,valid.data.password);
    // Same answer for new accounts, existing Google accounts, and rate-limited requests.
    return {success:true,message:"If this address is eligible, we'll send a verification link. Check your inbox."};
  } catch {
    return {message:"Unable to send verification right now. Please try again later."};
  }
}
export async function verifyEmailAction(_:AuthFormState,form:FormData):Promise<AuthFormState> {
  let verified=false;
  try {
    verified=await verifyEmailToken(empty(form,"token"));
  } catch {
    return {message:"Could not verify the address. Please try again."};
  }
  if (verified) redirect("/sign-in?verified=1");
  return {message:"This verification link is invalid or has expired."};
}
export async function requestResetAction(_:AuthFormState,form:FormData):Promise<AuthFormState> {
  if (!emailSignUpConfigured()) return {message:"Email recovery is not enabled yet."};
  const valid=emailSchema.safeParse(empty(form,"email"));
  if (!valid.success) return {message:"Enter a valid email address."};
  try {
    await requestPasswordReset(valid.data);
    return {success:true,message:"If an eligible account exists, we'll email a reset link."};
  } catch {
    return {message:"Password recovery is temporarily unavailable."};
  }
}
export async function resetPasswordAction(_:AuthFormState,form:FormData):Promise<AuthFormState> {
  const valid=resetSchema.safeParse({
    token:empty(form,"token"),password:empty(form,"password"),
    confirmPassword:empty(form,"confirmPassword"),
  });
  if (!valid.success) return {message:valid.error.issues[0]?.message || "Check the fields."};
  try {
    if (await resetEmailPassword(valid.data.token,valid.data.password))
      return {success:true,message:"Password updated. You can now sign in."};
    return {message:"That password reset link is invalid or expired."};
  } catch {
    return {message:"Could not update your password. Try again later."};
  }
}
