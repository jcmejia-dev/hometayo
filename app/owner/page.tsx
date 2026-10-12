import Link from "next/link";
import { ArrowLeft, ArrowRight, Camera, CheckCircle2, Megaphone, ShieldCheck } from "lucide-react";

export default function OwnerPage() {
  return (
    <section className="container interior-page narrow-page">
      <Link href="/" className="back-link"><ArrowLeft size={17} /> Back to HomeTayo</Link>
      <div className="interior-heading"><p className="section-kicker">FOR PROPERTY OWNERS</p><h1>Let people discover your space.</h1><p>HomeTayo will make it easier to showcase rental vacancies, stay organized, and share a single clear listing link.</p></div>
      <div className="info-card">
        <h2>What owners will get</h2>
        <div className="info-step"><Camera size={22} /><p>A simple property page with owner-authorized photos, price, amenities, and rental terms.</p></div>
        <div className="info-step"><Megaphone size={22} /><p>A shareable link to add to your existing Facebook posts. No need to leave Facebook.</p></div>
        <div className="info-step"><ShieldCheck size={22} /><p>Control over what contact information is public and when the vacancy is available.</p></div>
        <div className="info-step"><CheckCircle2 size={22} /><p>Basic listings planned to be free for initial pilot owners.</p></div>
        <div className="status-notice">Owner registration and property submission are not enabled yet. We are preparing the Koronadal pilot.</div>
      </div>
      <Link href="/rentals" className="text-link bottom-link">See renter experience <ArrowRight size={18} /></Link>
    </section>
  );
}
