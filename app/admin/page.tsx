import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ClipboardCheck, ShieldCheck } from "lucide-react";
import { desc, eq } from "drizzle-orm";
import { currentUser } from "@/lib/session-user";
import { getDatabase } from "@/lib/db";
import { listings } from "@/db/schema";
import { reviewProperty } from "./actions";
import { formatRent } from "@/lib/search-filters";
import { AdminOverview } from "@/components/admin-overview";

export const dynamic = "force-dynamic";
export default async function AdminPage() {
  const user = await currentUser();
  if (!user || (user.role !== "admin" && user.role !== "moderator")) notFound();
  const db = getDatabase();
  if (!db) throw new Error("Database not configured.");
  const submissions = await db.select({
    id: listings.id, title: listings.title, description: listings.description,
    city: listings.city, barangay: listings.barangay,
    monthlyRentCentavos: listings.monthlyRentCentavos,
    propertyType: listings.propertyType, createdAt: listings.createdAt,
  }).from(listings).where(eq(listings.status, "pending_review")).orderBy(desc(listings.createdAt)).limit(50);

  return (
    <section className="container interior-page admin-control-page">
      <Link href="/" className="back-link"><ArrowLeft size={17}/> HomeTayo</Link>
      <div className="interior-heading">
        <span className="page-icon"><ClipboardCheck size={27}/></span>
        <p className="section-kicker">MODERATION</p><h1>Rental review queue</h1>
        <p>Review property authorization and details. Approval is not a legal or physical guarantee.</p>
      </div>
      <AdminOverview />
      <div className="admin-section-heading admin-review-queue-heading"><div><p className="section-kicker">NEEDS YOUR ATTENTION</p><h2>Pending property reviews</h2></div></div>
      {submissions.length === 0 && <div className="info-card"><h2>You&apos;re all caught up.</h2><p>No rental submissions are waiting for review.</p></div>}
      <div className="owner-list">
        {submissions.map((item) => (
          <article key={item.id} className="owner-listing admin-listing">
            <div>
              <span className="owner-status">{item.propertyType.replaceAll("_"," ")}</span>
              <h2>{item.title}</h2>
              <p>{item.barangay}, {item.city} · {formatRent(item.monthlyRentCentavos)}/month</p>
              <p className="admin-description">{item.description}</p>
              <p className="owner-disclaimer"><ShieldCheck size={15}/> Verify the owner&apos;s authority before approving.</p>
            </div>
            <div className="review-actions">
              <form action={reviewProperty}>
                <input type="hidden" name="id" value={item.id}/>
                <input type="hidden" name="decision" value="approved"/>
                <button type="submit" className="button button-primary">Approve</button>
              </form>
              <form action={reviewProperty}>
                <input type="hidden" name="id" value={item.id}/>
                <input type="hidden" name="decision" value="rejected"/>
                <input name="reason" aria-label="Rejection reason" required minLength={5} maxLength={500} placeholder="Reason for rejection"/>
                <button type="submit" className="button button-outline">Reject</button>
              </form>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
