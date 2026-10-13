import Link from "next/link";
import { AuthShell } from "@/components/auth-shell";
import { ForgotPasswordForm } from "@/components/auth-forms";
import { emailSignUpConfigured } from "@/lib/email-auth";
export const dynamic="force-dynamic";
export default function ForgotPasswordPage() {
  const enabled=emailSignUpConfigured();
  return <AuthShell mode="other" eyebrow="ACCOUNT RECOVERY" title="Reset your password."
    description="We'll send a secure recovery link to your verified email address.">
    {enabled ? <ForgotPasswordForm enabled/> :
      <p className="auth-setup-notice">Email recovery is not enabled yet. Google users can sign in directly with Google.</p>}
    <p className="auth-switch-note"><Link href="/sign-in">Back to sign in</Link></p>
  </AuthShell>;
}
