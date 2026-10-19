import Link from "next/link";

export function SiteFooter({signedIn=false}:{signedIn?:boolean}){
  return <footer className="site-footer">
    <div className="container footer-layout">
      <div className="footer-identity">
        <Link href="/" className="footer-brand" aria-label="HomeTayo home"><span className="footer-mark" aria-hidden="true"/><span>Home<span className="brand-accent">Tayo</span></span></Link>
        <p>A place to belong, together.</p>
      </div>
      <nav aria-label="Footer navigation">
        <div>
          <span>{signedIn?"Discover":"Learn"}</span>
          {signedIn&&<Link href="/rentals">Explore rentals</Link>}
          <Link href="/how-it-works">How it works</Link>
          <Link href="/safety">Rental safety</Link>
          <Link href="/download">Get the Android app</Link>
        </div>
        <div>
          <span>HomeTayo</span>
          {signedIn?<Link href="/profile">My profile</Link>:<><Link href="/sign-up">Create account</Link><Link href="/sign-in">Sign in</Link></>}
          <Link href="/privacy">Privacy</Link>
        </div>
      </nav>
    </div>
    <div className="container footer-bottom"><span>Made for your next chapter.</span><span>© {new Date().getFullYear()} HomeTayo</span></div>
  </footer>;
}
