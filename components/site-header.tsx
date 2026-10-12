import Link from "next/link";
import { ArrowUpRight, House, Menu } from "lucide-react";

export function SiteHeader() {
  return (
    <>
      <a className="skip-link" href="#main-content">Skip to content</a>
      <header className="site-header">
        <div className="container header-inner">
          <Link href="/" className="brand" aria-label="HomeTayo home">
            <span className="brand-icon"><House size={21} strokeWidth={2.4} /></span>
            <span>hometayo<span className="brand-dot">.</span></span>
          </Link>
          <nav className="desktop-nav" aria-label="Primary navigation">
            <Link href="/rentals">Explore rentals</Link>
            <Link href="/#how-it-works">How it works</Link>
            <Link href="/safety">Rental safety</Link>
          </nav>
          <Link className="header-owner" href="/owner">
            List your property <ArrowUpRight size={16} aria-hidden="true" />
          </Link>
          <details className="mobile-menu">
            <summary aria-label="Open navigation menu"><Menu size={23} /></summary>
            <nav aria-label="Mobile navigation">
              <Link href="/rentals">Explore rentals</Link>
              <Link href="/#how-it-works">How it works</Link>
              <Link href="/safety">Rental safety</Link>
              <Link href="/owner">List your property</Link>
            </nav>
          </details>
        </div>
      </header>
    </>
  );
}
