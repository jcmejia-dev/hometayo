import Link from "next/link";
import type { ReactNode } from "react";

type Mode = "login" | "signup" | "other";

export function AuthShell({mode,title,children}:{
  mode: Mode;
  title: string;
  children: ReactNode;
}){
  return (
    <div className="auth-screen">
      <section className="auth-layout" aria-labelledby="auth-title">
        <div className="auth-card-header">
          <h1 id="auth-title">{title}</h1>
          <Link href="/" className="auth-mini-brand" aria-label="HomeTayo home">
            <span className="auth-mini-mark" aria-hidden="true"/>
            Home<span>Tayo</span>
          </Link>
        </div>
        {children}
        {mode !== "other" && <p className="auth-switch-note">
          {mode === "login" ? <>New to HomeTayo? <Link href="/sign-up">Create account</Link></>
            : <>Already have an account? <Link href="/sign-in">Sign in</Link></>}
        </p>}
        <p className="auth-guest-link"><Link href="/rentals">Explore rentals without an account →</Link></p>
        <p className="auth-guest-link"><Link href="/?intro=1">Discover what HomeTayo does →</Link></p>
      </section>
    </div>
  );
}
