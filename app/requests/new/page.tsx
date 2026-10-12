import Link from "next/link";
import { ArrowLeft, BellRing, CheckCircle2, ClipboardList } from "lucide-react";

export default function RentalRequestsPage() {
  return (
    <section className="container interior-page narrow-page">
      <Link href="/rentals" className="back-link"><ArrowLeft size={17} /> Back to search</Link>
      <div className="interior-heading"><span className="page-icon"><ClipboardList size={26} /></span><p className="section-kicker">RENTAL REQUESTS</p><h1>Can&apos;t find your next home?</h1><p>Rental requests will help us connect future listings with people looking for something specific.</p></div>
      <div className="info-card">
        <h2>How it will work</h2>
        <div className="info-step"><CheckCircle2 size={21} /><p>Describe your preferred location, monthly budget and number of rooms.</p></div>
        <div className="info-step"><CheckCircle2 size={21} /><p>We only share aggregated demand with landlords — never your private contact details without consent.</p></div>
        <div className="info-step"><BellRing size={21} /><p>When new matching listings are available, you can opt in to receive alerts.</p></div>
        <div className="status-notice">This feature is being built. Requests are not being collected or saved yet.</div>
      </div>
    </section>
  );
}
