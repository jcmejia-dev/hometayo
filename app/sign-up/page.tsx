import Link from "next/link";
import { redirect } from "next/navigation";
import { signIn } from "@/auth";
import { currentUser } from "@/lib/session-user";
import { googleSignInConfigured,emailSignUpConfigured } from "@/lib/email-auth";
import { AuthShell } from "@/components/auth-shell";
import { EmailSignUpForm } from "@/components/auth-forms";

export const dynamic = "force-dynamic";
export default async function SignUpPage() {
  if (await currentUser()) redirect("/owner");
  const enabled=emailSignUpConfigured(),google=googleSignInConfigured();
  return <AuthShell mode="signup" eyebrow="MAKE YOURSELF AT HOME" title="Create your account."
    description="Discover rentals and manage your own listings with HomeTayo.">
    {!enabled && <p className="auth-setup-notice" role="status">Email registration is not enabled yet. You can create an account with Google below.</p>}
    <EmailSignUpForm enabled={enabled}/>
    {google && <>
      <div className="auth-divider"><span>or sign up with</span></div>
      <form action={async()=>{"use server";await signIn("google",{redirectTo:"/owner"});}}>
        <button type="submit" className="auth-google-button"><span className="auth-google-letter" aria-hidden="true">G</span> Continue with Google</button>
      </form>
    </>}
    <p className="auth-switch-note">Already have an account? <Link href="/sign-in">Sign in</Link></p>
  </AuthShell>;
}
