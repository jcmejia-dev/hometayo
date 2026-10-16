import Link from "next/link";
import { ArrowUpRight, Menu } from "lucide-react";
import { currentUser } from "@/lib/session-user";

export async function SiteHeader() {
  const user = await currentUser();
  return (
    <>
      <a className="skip-link" href="#main-content">Skip to content</a>
      <header className="site-header">
        <div className="container header-inner">
          <Link href="/" className="brand" aria-label="HomeTayo home">
            <span className="brand-icon" aria-hidden="true" />
            <span className="brand-wordmark">Home<span className="brand-accent">Tayo</span></span>
          </Link>
          <nav className="desktop-nav" aria-label="Primary navigation">
            <Link href="/rentals">Explore rentals</Link>
            <Link href="/how-it-works">How it works</Link>
            <Link href="/safety">Rental safety</Link>
            {user ? <Link href="/profile">My profile</Link> : <Link href="/sign-in">Sign in</Link>}
            <Link href="/download">Install app</Link>
          </nav>
          {(!user || user.role === "landlord") && <Link className="header-owner" href={user ? "/owner" : "/sign-up"}>
            {user ? "List your property" : "Create account"} <ArrowUpRight size={16} aria-hidden="true" />
          </Link>}
          <details className="mobile-menu">
            <summary aria-label="Open navigation menu"><Menu size={23} /></summary>
            <nav aria-label="Mobile navigation">
              <Link href="/rentals">Explore rentals</Link>
              <Link href="/how-it-works">How it works</Link>
              <Link href="/safety">Rental safety</Link>
              {(!user||user.role === "landlord")&&<Link href="/owner">List your property</Link>}
              {user ? <Link href="/profile">My profile</Link> : <><Link href="/sign-in">Sign in</Link><Link href="/sign-up">Create account</Link></>}
              <Link href="/download">Install Android app</Link>
              <Link href="/privacy">Privacy</Link>
            </nav>
          </details>
        </div>
      </header>
    </>
  );
}
