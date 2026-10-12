import "server-only";
import { desc, eq, sql } from "drizzle-orm";
import { notFound } from "next/navigation";
import { Activity, Building2, ClipboardList, House, ShieldCheck, UsersRound } from "lucide-react";
import { listingReviews, listings, ownerProfiles, platformEvents, users } from "@/db/schema";
import { getDatabase } from "@/lib/db";
import { currentUser } from "@/lib/session-user";

const label: Record<string,string> = {
  "listing.submitted": "Submitted a listing",
  "listing.approved": "Approved a listing",
  "listing.rejected": "Rejected a listing",
  "listing.paused": "Marked a listing unavailable",
};

function dateTime(date: Date): string {
  return new Intl.DateTimeFormat("en-PH", {
    dateStyle: "medium",timeStyle: "short",timeZone: "Asia/Manila",
  }).format(date);
}

export async function AdminOverview() {
  // Defense in depth. A developer cannot render this elsewhere without the role check.
  const actor = await currentUser();
  if (!actor || (actor.role !== "admin" && actor.role !== "moderator")) notFound();
  const db = getDatabase();
  if (!db) throw new Error("Database not configured.");

  const [registered, owners, listingStatuses, activity, reviews, newest] = await Promise.all([
    db.select({ count: sql<number>`count(*)::int` }).from(users),
    db.select({ count: sql<number>`count(*)::int` }).from(ownerProfiles),
    db.select({ status: listings.status, count: sql<number>`count(*)::int` }).from(listings).groupBy(listings.status),
    db.select({
      id: platformEvents.id, kind: platformEvents.kind, occurredAt: platformEvents.createdAt,
      actorName: users.displayName, title: listings.title,
    }).from(platformEvents)
      .innerJoin(users,eq(platformEvents.actorUserId,users.id))
      .leftJoin(listings,eq(platformEvents.listingId,listings.id))
      .orderBy(desc(platformEvents.createdAt)).limit(15),
    db.select({
      id: listingReviews.id, decision: listingReviews.decision,
      occurredAt: listingReviews.createdAt, reviewerName: users.displayName,
      title: listings.title,
    }).from(listingReviews)
      .innerJoin(users,eq(listingReviews.reviewerId,users.id))
      .innerJoin(listings,eq(listingReviews.listingId,listings.id))
      .orderBy(desc(listingReviews.createdAt)).limit(10),
    db.select({ id:users.id, displayName:users.displayName, role:users.role, createdAt:users.createdAt })
      .from(users).orderBy(desc(users.createdAt)).limit(8),
  ]);
  const byStatus = Object.fromEntries(listingStatuses.map((row) => [row.status,row.count]));
  const stats = [
    { title:"Accounts", value:registered[0]?.count ?? 0, icon:UsersRound },
    { title:"Owners", value:owners[0]?.count ?? 0, icon:Building2 },
    { title:"Published", value:byStatus.published ?? 0, icon:House },
    { title:"Pending approval", value:byStatus.pending_review ?? 0, icon:ClipboardList },
  ];
  const totalListings = listingStatuses.reduce((sum,row) => sum + row.count,0);

  return (
    <section className="admin-overview" aria-labelledby="admin-overview-heading">
      <div className="admin-section-heading">
        <div><p className="section-kicker">PLATFORM AT A GLANCE</p><h2 id="admin-overview-heading">HomeTayo operations</h2></div>
        <span className="admin-live-label"><Activity size={15}/> Database-backed snapshot</span>
      </div>
      <div className="admin-stats">
        {stats.map(({title,value,icon:Icon}) => (
          <div key={title} className="admin-stat">
            <span className="admin-stat-icon"><Icon size={21}/></span>
            <span className="admin-stat-value">{value.toLocaleString("en-PH")}</span>
            <span className="admin-stat-title">{title}</span>
          </div>
        ))}
      </div>
      <div className="admin-summary-line">Total submitted listings: <strong>{totalListings}</strong> · Rejected: <strong>{byStatus.rejected ?? 0}</strong> · Unavailable: <strong>{(byStatus.paused ?? 0) + (byStatus.occupied ?? 0)}</strong></div>
      <div className="admin-data-grid">
        <section className="admin-data-card" aria-labelledby="admin-activity-title">
          <div className="admin-data-heading"><Activity size={19}/><h3 id="admin-activity-title">Recent listing activity</h3></div>
          {activity.length === 0 ? <p className="admin-data-empty">No recorded events yet. Activity appears here after Job 4 is migrated and new actions occur.</p> :
            <ul className="admin-activity-list">
              {activity.map((event) => <li key={event.id}>
                <span className="admin-activity-dot" aria-hidden="true"/>
                <div><strong>{label[event.kind] ?? "Listing update"}</strong><p>{event.actorName ?? "Account"}{event.title ? " · " + event.title : ""}</p><time dateTime={event.occurredAt.toISOString()}>{dateTime(event.occurredAt)}</time></div>
              </li>)}
            </ul>}
        </section>
        <section className="admin-data-card" aria-labelledby="admin-account-title">
          <div className="admin-data-heading"><UsersRound size={19}/><h3 id="admin-account-title">Recently registered accounts</h3></div>
          {newest.length === 0 ? <p className="admin-data-empty">No accounts yet.</p> :
            <ul className="admin-account-list">
              {newest.map((member) => <li key={member.id}>
                <span className="admin-mini-avatar"><UsersRound size={15}/></span>
                <div><strong>{member.displayName || "Unnamed member"}</strong><time dateTime={member.createdAt.toISOString()}>{dateTime(member.createdAt)}</time></div>
                <span className="admin-role-pill">{member.role}</span>
              </li>)}
            </ul>}
        </section>
      </div>
      <section className="admin-data-card admin-review-history" aria-labelledby="admin-history-title">
        <div className="admin-data-heading"><ShieldCheck size={20}/><h3 id="admin-history-title">Recent moderation decisions</h3></div>
        {reviews.length === 0 ? <p className="admin-data-empty">No approval or rejection history yet.</p> :
          <ul className="admin-review-list">{reviews.map((review) => <li key={review.id}>
            <span className="admin-history-decision">{review.decision}</span>
            <div><strong>{review.title}</strong><p>{review.reviewerName ?? "Moderator"} · {dateTime(review.occurredAt)}</p></div>
          </li>)}</ul>}
      </section>
      <p className="admin-tracking-disclaimer">These are database counts and explicitly recorded property operations, not website traffic, visitor surveillance, revenue, payments, or private renter searches. Earlier actions will not be backfilled automatically.</p>
    </section>
  );
}
