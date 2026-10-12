import Link from "next/link";
import { House } from "lucide-react";

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="container footer-inner">
        <div>
          <Link href="/" className="footer-brand"><House size={18} /> hometayo.</Link>
          <p>Finding a place to belong, together.</p>
        </div>
        <nav aria-label="Footer navigation">
          <Link href="/rentals">Explore</Link>
          <Link href="/owner">For owners</Link>
          <Link href="/how-it-works">How it works</Link>
          <Link href="/safety">Safety</Link>
          <Link href="/privacy">Privacy</Link>
        </nav>
        <p className="footer-note">Koronadal pilot · © {new Date().getFullYear()} HomeTayo</p>
      </div>
    </footer>
  );
}
