import Link from "next/link";
import { ArrowLeft, ArrowRight, Building2, LogOut, Plus, ShieldCheck } from "lucide-react";
import { eq, desc } from "drizzle-orm";
import { authIsConfigured, signOut } from "@/auth";
import { currentUser } from "@/lib/session-user";
import { getDatabase } from "@/lib/db";
import { listings, ownerProfiles } from "@/db/schema";
import { formatRent } from "@/lib/search-filters";
import { pauseProperty } from "./actions";
import { GuideNudge } from "@/components/guide-nudge";

export const dynamic = "force-dynamic";
export default async function OwnerPage({ searchParams }: { searchParams: Promise<{ submitted?: string }> }) {
  const user = await currentUser();
  const params = await searchParams;
  const db = getDatabase();
  let owned: Array<{ id: string; title: string; status: string; slug: string; monthlyRentCentavos: number }> = [];
  if (user && db) {
    const [owner] = await db.select({ id: ownerProfiles.id }).from(ownerProfiles)
      .where(eq(ownerProfiles.userId, user.id)).limit(1);
    if (owner) owned = await db.select({
      id: listings.id, title: listings.title, status: listings.status,
      slug: listings.slug, monthlyRentCentavos: listings.monthlyRentCentavos,
    }).from(listings).where(eq(listings.ownerId, owner.id)).orderBy(desc(listings.createdAt));
  }

  return (
    <section className="container interior-page narrow-page">
      <Link href="/" className="back-link"><ArrowLeft size={17}/> Back to HomeTayo</Link>
      <div className="interior-heading">
        <p className="section-kicker">PROPERTY OWNER STUDIO</p>
        <h1>{user ? "Your rental listings." : "Let people discover your space."}</h1>
        <p>{user ? "See listing status and manage availability." : "List a space for review before it appears publicly."}</p>
      </div>
      <GuideNudge audience="owner" compact />
      {user?.role === "landlord" && <Link className="button button-primary" href="/inbox">Dashboard, messages & rent ledger <ArrowRight size={18}/></Link>}
      {!user ? (
        <div className="info-card">
          <h2>What owners will get</h2>
          <div className="info-step"><Building2 size={22}/><p>Submit property details, rent, location and contact preferences for review.</p></div>
          <div className="info-step"><ShieldCheck size={22}/><p>Property submissions remain unpublished until an administrator approves them.</p></div>
          {authIsConfigured() ? (
            <Link className="button button-primary bottom-link" href="/sign-in">Sign in or create account <ArrowRight size={17}/></Link>
          ) : (
            <div className="status-notice">Owner sign-in is unavailable until authentication is configured. Browse existing rentals while we complete setup.</div>
          )}
        </div>
      ) : (
        <>
          {params.submitted === "1" && <div className="status-notice">Your rental was submitted for review. It is not public until approved.</div>}
          <div className="owner-toolbar">
            <span>Signed in as {user.displayName || user.email}</span>
            <div className="owner-actions">
              <Link href="/owner/listings/new" className="button button-primary"><Plus size={18}/> Submit a property</Link>
              <form action={async () => {
                "use server";
                await signOut({ redirectTo: "/sign-in" });
              }}>
                <button type="submit" className="button button-outline"><LogOut size={17}/> Sign out</button>
              </form>
            </div>
          </div>
          <div className="owner-quick-stats" aria-label="Your listing overview">
            <span><strong>{owned.length}</strong> Total</span>
            <span><strong>{owned.filter((item) => item.status === "pending_review").length}</strong> In review</span>
            <span><strong>{owned.filter((item) => item.status === "published").length}</strong> Live</span>
          </div>
          {owned.length === 0 ? (
            <div className="info-card">
              <h2>No properties submitted yet</h2>
              <p className="auth-security">Start by entering accurate details about a property you are authorized to list.</p>
              <Link href="/owner/listings/new" className="button button-outline">Add first listing <ArrowRight size={17}/></Link>
            </div>
          ) : (
            <div className="owner-list">
              {owned.map((listing) => (
                <article key={listing.id} className="owner-listing">
                  <div>
                    <span className="owner-status">{listing.status.replaceAll("_", " ")}</span>
                    <h2>{listing.title}</h2>
                    <p>{formatRent(listing.monthlyRentCentavos)} / month</p>
                    {user.role === "landlord" && <Link href={`/owner/listings/${listing.id}/units`} className="button button-outline">Manage rooms & availability</Link>}
                    {listing.status === "published" && <Link href={"/rentals/" + listing.slug} className="text-link">View public listing <ArrowRight size={16}/></Link>}
                  </div>
                  {listing.status === "published" && (
                    <form action={pauseProperty}>
                      <input type="hidden" name="id" value={listing.id}/>
                      <button className="button button-outline" type="submit">Mark unavailable</button>
                    </form>
                  )}
                </article>
              ))}
            </div>
          )}
          <p className="owner-disclaimer">Room availability and photo links can be managed from each property when rental management is enabled. Only advertise a property you own or have permission to list.</p>
        </>
      )}
    </section>
  );
}
