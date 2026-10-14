import { redirect } from "next/navigation";
import { signIn } from "@/auth";
import { googleSignInConfigured, emailPasswordSignInConfigured } from "@/lib/email-auth";
import { currentUser } from "@/lib/session-user";
import { AuthShell } from "@/components/auth-shell";
import { EmailLoginForm } from "@/components/auth-forms";

export const dynamic = "force-dynamic";

export default async function SignInPage({searchParams}:{
  searchParams:Promise<{verified?:string}>
}) {
  if (await currentUser()) redirect("/");
  const google = googleSignInConfigured();
  const email = emailPasswordSignInConfigured();
  const {verified} = await searchParams;
  return (
    <AuthShell mode="login" title="Sign in">
      {verified === "1" && <p className="auth-form-success" role="status">Email verified. You can sign in now.</p>}
      <EmailLoginForm enabled={email}/>
      {google && <>
        <div className="auth-divider"><span>or continue with</span></div>
        <form action={async () => { "use server"; await signIn("google",{redirectTo:"/"}); }}>
          <button type="submit" className="auth-google-button">
            <span className="auth-google-letter" aria-hidden="true">G</span>
            Continue with Google
          </button>
        </form>
      </>}
      {!email && !google && <p className="auth-unavailable" role="status">Sign-in is currently unavailable.</p>}
    </AuthShell>
  );
}
