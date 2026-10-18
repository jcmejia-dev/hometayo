import Link from "next/link";
import { ArrowUpRight, Menu } from "lucide-react";
import { currentUser } from "@/lib/session-user";
import { canAdminister } from "@/lib/admin-owner";
import { HeaderInboxActions } from "@/components/header-inbox-actions";

export async function SiteHeader() {
  const user = await currentUser();
  const isAdmin = canAdminister(user);
  const isLandlord=user?.role==="landlord";

  if (isAdmin) {
    return (
      <>
        <a className="skip-link" href="#main-content">Skip to content</a>
        <header className="site-header">
          <div className="container header-inner">
            <Link href="/administratorsite" className="brand" aria-label="HomeTayo admin dashboard">
              <span className="brand-icon" aria-hidden="true" />
              <span className="brand-wordmark">Home<span className="brand-accent">Tayo</span></span>
            </Link>
            <span className="header-owner" aria-current="page">Admin dashboard</span>
          </div>
        </header>
      </>
    );
  }

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
            {user&&<Link href={isLandlord?"/owner":"/"}>My dashboard</Link>}
            {!isLandlord&&<Link href="/rentals">Explore rentals</Link>}
            <Link href="/how-it-works">How it works</Link>
            <Link href="/safety">Rental safety</Link>
            {user ? <Link href="/profile">My profile</Link> : <Link href="/sign-in">Sign in</Link>}
            <Link href="/download">Install app</Link>
          </nav>
          {(!user || isLandlord) && <Link className="header-owner" href={user ? "/owner" : "/sign-up"}>
            {user ? "List your property" : "Create account"} <ArrowUpRight size={16} aria-hidden="true" />
          </Link>}
          {user && process.env.ENABLE_RENTAL_MANAGEMENT==="true" && <HeaderInboxActions/>}
          <details className="mobile-menu">
            <summary aria-label="Open navigation menu"><Menu size={23} /></summary>
            <nav aria-label="Mobile navigation">
              {user&&<Link href={isLandlord?"/owner":"/"}>My dashboard</Link>}
              {!isLandlord&&<Link href="/rentals">Explore rentals</Link>}
              <Link href="/how-it-works">How it works</Link>
              <Link href="/safety">Rental safety</Link>
              {(!user||isLandlord)&&<Link href="/owner">List your property</Link>}
              {user ? <Link href="/profile">My profile</Link> : <><Link href="/sign-in">Sign in</Link><Link href="/sign-up">Create account</Link></>}
              {user && <Link href="/inbox">Messages</Link>}
              <Link href="/download">Install Android app</Link>
              <Link href="/privacy">Privacy</Link>
            </nav>
          </details>
        </div>
      </header>
    </>
  );
}
