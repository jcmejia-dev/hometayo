import Link from "next/link";
import { ArrowLeft, KeyRound, ShieldCheck } from "lucide-react";
import { authIsConfigured, signIn } from "@/auth";
import { currentUser } from "@/lib/session-user";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function SignIn() {
  if (await currentUser()) redirect("/owner");
  const configured = authIsConfigured();
  return (
    <div className="container interior-page narrow-page">
      <Link href="/" className="back-link"><ArrowLeft size={17}/> Back to HomeTayo</Link>
      <div className="interior-heading">
        <span className="page-icon"><KeyRound size={26}/></span>
        <p className="section-kicker">WELCOME TO HOMETAYO</p>
        <h1>Sign in to manage your rentals.</h1>
        <p>Google sign-in is free. Browse rental listings without an account.</p>
      </div>
      <div className="info-card">
        {configured ? (
          <form action={async () => {
            "use server";
            await signIn("google", { redirectTo: "/owner" });
          }}>
            <button type="submit" className="button button-primary">Continue with Google</button>
          </form>
        ) : <div className="status-notice">Google login is awaiting owner setup. Add AUTH_SECRET, AUTH_GOOGLE_ID and AUTH_GOOGLE_SECRET to your private .env.local file to enable it.</div>}
        <p className="auth-security"><ShieldCheck size={16}/> Sign-in uses Google OAuth. HomeTayo never requests your Google password.</p>
      </div>
    </div>
  );
}
