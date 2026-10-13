import { redirect } from "next/navigation";
import { signIn } from "@/auth";
import { currentUser } from "@/lib/session-user";
import { googleSignInConfigured, emailSignUpConfigured } from "@/lib/email-auth";
import { AuthShell } from "@/components/auth-shell";
import { EmailSignUpForm } from "@/components/auth-forms";

export const dynamic = "force-dynamic";
export default async function SignUpPage() {
  if (await currentUser()) redirect("/owner");
  const enabled = emailSignUpConfigured();
  const google = googleSignInConfigured();
  return (
    <AuthShell mode="signup" title="Create account">
      <EmailSignUpForm enabled={enabled}/>
      {google && <>
        <div className="auth-divider"><span>or continue with</span></div>
        <form action={async () => { "use server"; await signIn("google",{redirectTo:"/owner"}); }}>
          <button className="auth-google-button" type="submit">
            <span className="auth-google-letter" aria-hidden="true">G</span>
            Continue with Google
          </button>
        </form>
      </>}
      {!enabled && !google && <p className="auth-unavailable" role="status">Account creation is currently unavailable.</p>}
    </AuthShell>
  );
}
