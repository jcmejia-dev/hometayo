import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="container footer-inner">
        <div className="footer-identity">
          <Link href="/" className="footer-brand" aria-label="HomeTayo home"><span className="footer-mark" aria-hidden="true" /><span>Home<span className="brand-accent">Tayo</span></span></Link>
          <p>Finding a place to belong, together.</p>
        </div>
        <nav aria-label="Footer navigation">
          <Link href="/rentals">Explore</Link>
          <Link href="/owner">For owners</Link>
          <Link href="/profile">My profile</Link>
          <Link href="/how-it-works">How it works</Link>
          <Link href="/safety">Safety</Link>
          <Link href="/privacy">Privacy</Link>
        </nav>
        <p className="footer-note">© {new Date().getFullYear()} HomeTayo</p>
      </div>
    </footer>
  );
}
