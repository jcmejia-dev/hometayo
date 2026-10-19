"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowUpRight, Menu } from "lucide-react";
import { HeaderInboxActions } from "@/components/header-inbox-actions";

export function SiteHeaderClient({
  signedIn,
  isLandlord,
  rentalManagementEnabled,
}: {
  signedIn: boolean;
  isLandlord: boolean;
  rentalManagementEnabled: boolean;
}) {
  const pathname = usePathname();
  const isAdminRoute = pathname === "/administratorsite" || pathname.startsWith("/administratorsite/");

  if (isAdminRoute) {
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
            {signedIn ? (
              <>
                <Link href={isLandlord ? "/owner" : "/"}>My dashboard</Link>
                {!isLandlord && <Link href="/rentals">Explore rentals</Link>}
                <Link href="/how-it-works">How it works</Link>
                <Link href="/safety">Rental safety</Link>
                <Link href="/profile">My profile</Link>
                <Link href="/download">Install app</Link>
              </>
            ) : (
              <>
                <Link href="/how-it-works">How it works</Link>
                <Link href="/safety">Rental safety</Link>
                <Link href="/download">Install app</Link>
                <Link href="/sign-in">Sign in</Link>
              </>
            )}
          </nav>

          {(!signedIn || isLandlord) && (
            <Link className="header-owner" href={signedIn ? "/owner" : "/sign-up"}>
              {signedIn ? "List your property" : "Create account"} <ArrowUpRight size={16} aria-hidden="true" />
            </Link>
          )}

          {signedIn && rentalManagementEnabled && <HeaderInboxActions />}

          <details className="mobile-menu">
            <summary aria-label="Open navigation menu"><Menu size={23} /></summary>
            <nav aria-label="Mobile navigation">
              {signedIn ? (
                <>
                  <Link href={isLandlord ? "/owner" : "/"}>My dashboard</Link>
                  {!isLandlord && <Link href="/rentals">Explore rentals</Link>}
                  <Link href="/how-it-works">How it works</Link>
                  <Link href="/safety">Rental safety</Link>
                  {isLandlord && <Link href="/owner">List your property</Link>}
                  <Link href="/profile">My profile</Link>
                  <Link href="/inbox">Messages</Link>
                  <Link href="/download">Install Android app</Link>
                  <Link href="/privacy">Privacy</Link>
                </>
              ) : (
                <>
                  <Link href="/how-it-works">How it works</Link>
                  <Link href="/safety">Rental safety</Link>
                  <Link href="/download">Install Android app</Link>
                  <Link href="/sign-in">Sign in</Link>
                  <Link href="/sign-up">Create account</Link>
                  <Link href="/privacy">Privacy</Link>
                </>
              )}
            </nav>
          </details>
        </div>
      </header>
    </>
  );
}
