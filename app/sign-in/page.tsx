import Link from "next/link";
import { redirect } from "next/navigation";
import { signIn } from "@/auth";
import { googleSignInConfigured, emailPasswordSignInConfigured } from "@/lib/email-auth";
import { currentUser } from "@/lib/session-user";
import { AuthShell } from "@/components/auth-shell";
import { EmailLoginForm } from "@/components/auth-forms";

export const dynamic = "force-dynamic";
export default async function SignInPage({searchParams}:{searchParams:Promise<{verified?:string}>}) {
  if (await currentUser()) redirect("/owner");
  const google=googleSignInConfigured(),email=emailPasswordSignInConfigured();
  const {verified}=await searchParams;
  return <AuthShell mode="login" eyebrow="WELCOME BACK" title="Sign in to HomeTayo."
    description="Find a place, manage your rentals, and pick up where you left off.">
    {verified==="1" && <p className="auth-form-success" role="status">Email verified. You can sign in now.</p>}
    {email ? <EmailLoginForm/> :
      <p className="auth-setup-notice" role="status">Email sign-in is being configured. You can browse rentals without signing in.</p>}
    {google && <>
      {email && <div className="auth-divider"><span>or continue with</span></div>}
      <form action={async()=>{"use server";await signIn("google",{redirectTo:"/owner"});}}>
        <button type="submit" className="auth-google-button"><span className="auth-google-letter" aria-hidden="true">G</span> Continue with Google</button>
      </form>
    </>}
    {!google && !email && <p className="auth-setup-notice">Sign-in is awaiting secure server configuration.</p>}
    <p className="auth-switch-note">New to HomeTayo? <Link href="/sign-up">Create an account</Link></p>
  </AuthShell>;
}
