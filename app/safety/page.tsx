import Link from "next/link";
import { ArrowLeft, ShieldCheck } from "lucide-react";
export default function SafetyPage() {
  return <section className="container interior-page narrow-page">
    <Link href="/" className="back-link"><ArrowLeft size={17} /> Back to HomeTayo</Link>
    <div className="interior-heading"><span className="page-icon"><ShieldCheck size={25}/></span><h1>Rent smarter. Stay safer.</h1><p>Practical precautions for finding a rental property in the Philippines.</p></div>
    <div className="info-card legal-content"><h2>A few essential checks</h2><p>Confirm the property exists and that the person advertising it has authority to rent it out. Arrange a safe viewing and verify the terms before sending money.</p><p>Never send a deposit based solely on photos or urgency claims. Request written terms, receipts, and a clear explanation of utilities, advance payments and deposits.</p><p>HomeTayo is currently a prelaunch preview. It does not independently verify properties, process rent, or guarantee any tenancy.</p></div>
  </section>
}
