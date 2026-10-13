import type { Metadata } from "next";
import Link from "next/link";
import { AuthShell } from "@/components/auth-shell";
import { ResetPasswordForm } from "@/components/auth-forms";
export const metadata:Metadata={title:"Change password",referrer:"no-referrer"};
export const dynamic="force-dynamic";
export default async function ResetPasswordPage({searchParams}:{searchParams:Promise<{token?:string}>}) {
  const {token}=await searchParams;
  return <AuthShell mode="other" eyebrow="ACCOUNT RECOVERY" title="Choose a new password."
    description="Use at least 12 characters to secure your HomeTayo account.">
    {typeof token==="string"&&/^[A-Za-z0-9_-]{40,60}$/.test(token) ?
      <ResetPasswordForm token={token}/> :
      <p className="auth-setup-notice">That password reset link is missing or invalid.</p>}
    <p className="auth-switch-note"><Link href="/sign-in">Back to sign in</Link></p>
  </AuthShell>;
}
