import type { Metadata } from "next";
import Link from "next/link";
import { AuthShell } from "@/components/auth-shell";
import { VerifyEmailForm } from "@/components/auth-forms";
export const metadata:Metadata={title:"Verify your email",referrer:"no-referrer"};
export const dynamic="force-dynamic";
export default async function VerifyEmailPage({searchParams}:{searchParams:Promise<{token?:string}>}) {
  const {token}=await searchParams;
  return <AuthShell mode="other" eyebrow="ONE LAST STEP" title="Verify your email."
    description="Confirm your address to activate your HomeTayo account.">
    {typeof token==="string"&&/^[A-Za-z0-9_-]{40,60}$/.test(token) ?
      <VerifyEmailForm token={token}/> :
      <p className="auth-setup-notice">That verification link is missing or invalid.</p>}
    <p className="auth-switch-note"><Link href="/sign-in">Back to sign in</Link></p>
  </AuthShell>;
}
