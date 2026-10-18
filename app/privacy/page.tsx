import Link from "next/link";
import { ArrowLeft, LockKeyhole } from "lucide-react";

export default function PrivacyPage() {
  return <section className="container interior-page narrow-page">
    <Link href="/" className="back-link"><ArrowLeft size={17}/> Back to HomeTayo</Link>
    <div className="interior-heading"><span className="page-icon"><LockKeyhole size={25}/></span><h1>Privacy at HomeTayo</h1></div>
    <div className="info-card legal-content">
      <p><strong>What information the app uses.</strong> Anyone can browse published listings without an account. Signed-in users may authenticate through Google or, when enabled, a verified email and password. HomeTayo stores an account identifier, email, display name, role and optional saved preferences. For email/password accounts it additionally stores salted password hashes, verification/recovery token hashes and rate-limit counters; it never needs your Google password.</p>
      <p><strong>Property submissions.</strong> When you submit a rental, HomeTayo stores its location, description, rental price, owner-selected contact details, moderation decisions and related operational activity. Published listing information, including the contact method selected for publication, can be visible to visitors.</p>
      <p><strong>Property map selection.</strong> Address searches are sent to Google Maps. Current location is requested only when you press Use my location, and you choose whether to publish a confirmed property pin. HomeTayo does not track owners in the background. New listings use private HomeTayo messaging and do not require public phone or Messenger contact details.</p>
      <p><strong>How it is used.</strong> HomeTayo uses account information for sign-in and access control, saved preferences to help you search, and property details to publish owner-published listings. Search filters may appear in the page URL and can be shared, so please avoid entering sensitive information into the search field.</p>
      <p><strong>Rental management, when enabled.</strong> HomeTayo stores inquiry conversations and messages, tenancy invitations and dates, owner-recorded rent charges and payments, correction reasons, and in-app notifications. These are available only to the relevant owner and renter through their accounts. Public rental posts may include room labels, availability, photos, and aggregate reactions; tenant names and payment records are not published. Use neutral public room labels and avoid sharing passwords, bank credentials, or identity documents in messages.</p>
      <p><strong>Service providers and limits.</strong> Google provides sign-in, Neon stores application records, and your hosting provider may retain normal request logs. HomeTayo does not process money transfers or verify payments; its ledger reflects records entered by owners. Owner-supplied photo links load from external image hosts. The app does not provide a complete account deletion or data export interface yet.</p>
      <p><strong>Before a public launch.</strong> A complete policy with a contact channel, retention periods, access/deletion procedures, and other required Philippine data privacy notices must be finalized. This page is an interim description of the functionality currently implemented, not a substitute for a formal privacy policy.</p>
    </div>
  </section>;
}
