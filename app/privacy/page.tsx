import Link from "next/link";
import { ArrowLeft, LockKeyhole } from "lucide-react";
export default function PrivacyPage() {
  return <section className="container interior-page narrow-page">
    <Link href="/" className="back-link"><ArrowLeft size={17}/> Back to HomeTayo</Link>
    <div className="interior-heading"><span className="page-icon"><LockKeyhole size={25}/></span><h1>Privacy in our development preview</h1></div>
    <div className="info-card legal-content"><p>HomeTayo is currently a front-end demonstration. Search choices are passed in the page URL so you can share them; avoid putting sensitive information in the location field.</p><p>There is no account registration, property upload, renter-request submission, analytics tracking, or payment collection integrated into this preview. Routine hosting logs may still be collected by the hosting provider if deployed.</p><p>A complete production privacy notice, data retention policy and contact channel will be published before we collect user accounts or rental requests.</p></div>
  </section>
}
