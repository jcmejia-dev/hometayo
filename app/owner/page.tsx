import Link from "next/link";
import { ArrowLeft, ArrowRight, Building2, Pencil, Plus, ShieldCheck, Wallet, UsersRound, MessageCircle } from "lucide-react";
import { eq, desc, sql } from "drizzle-orm";
import { authIsConfigured } from "@/auth";
import { currentUser } from "@/lib/session-user";
import { getDatabase } from "@/lib/db";
import { listings, ownerProfiles } from "@/db/schema";
import { formatRent } from "@/lib/search-filters";
import { pauseProperty,publishProperty } from "./actions";
import { GuideNudge } from "@/components/guide-nudge";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";
export default async function OwnerPage({ searchParams }: { searchParams: Promise<{ submitted?: string;updated?:string }> }) {
  const user = await currentUser();
  if(user&&user.role!=="landlord")redirect("/");
  const params = await searchParams;
  const db = getDatabase();
  let owned: Array<{ id: string; title: string; status: string; slug: string; monthlyRentCentavos: number }> = [];
  let finance={collected:0,expected:0,outstanding:0,occupied:0,conversations:0};
  if (user && db) {
    const [owner] = await db.select({ id: ownerProfiles.id }).from(ownerProfiles).where(eq(ownerProfiles.userId, user.id)).limit(1);
    if (owner) {
      owned = await db.select({id:listings.id,title:listings.title,status:listings.status,slug:listings.slug,monthlyRentCentavos:listings.monthlyRentCentavos}).from(listings).where(eq(listings.ownerId, owner.id)).orderBy(desc(listings.createdAt));
      const result=await db.execute(sql`SELECT
        COALESCE((SELECT sum(p.amount_centavos) FROM rent_payments p JOIN rent_charges r ON r.id=p.charge_id JOIN rental_tenancies t ON t.id=r.tenancy_id JOIN rental_conversations c ON c.id=t.conversation_id WHERE c.owner_id=${user.id} AND p.voided_at IS NULL AND to_char(p.paid_on,'YYYY-MM')=to_char((now() AT TIME ZONE 'Asia/Manila'),'YYYY-MM')),0)::bigint AS collected,
        COALESCE((SELECT sum(r.amount_centavos) FROM rent_charges r JOIN rental_tenancies t ON t.id=r.tenancy_id JOIN rental_conversations c ON c.id=t.conversation_id WHERE c.owner_id=${user.id} AND r.voided_at IS NULL AND to_char(r.due_on,'YYYY-MM')=to_char((now() AT TIME ZONE 'Asia/Manila'),'YYYY-MM')),0)::bigint AS expected,
        COALESCE((SELECT sum(GREATEST(0,r.amount_centavos-COALESCE((SELECT sum(p.amount_centavos) FROM rent_payments p WHERE p.charge_id=r.id AND p.voided_at IS NULL),0))) FROM rent_charges r JOIN rental_tenancies t ON t.id=r.tenancy_id JOIN rental_conversations c ON c.id=t.conversation_id WHERE c.owner_id=${user.id} AND r.voided_at IS NULL AND r.due_on<=(now() AT TIME ZONE 'Asia/Manila')::date),0)::bigint AS outstanding,
        (SELECT count(*) FROM rental_units u JOIN listings l ON l.id=u.listing_id WHERE l.owner_id=${owner.id} AND u.status='occupied')::int AS occupied,
        (SELECT count(*) FROM rental_conversations WHERE owner_id=${user.id})::int AS conversations`);
      const row=result.rows[0] as Record<string,unknown>|undefined;
      finance={collected:Number(row?.collected||0),expected:Number(row?.expected||0),outstanding:Number(row?.outstanding||0),occupied:Number(row?.occupied||0),conversations:Number(row?.conversations||0)};
    }
  }

  return (
    <section className="container interior-page narrow-page">
      <Link href="/" className="back-link"><ArrowLeft size={17}/> Back to HomeTayo</Link>
      <div className="interior-heading">
        <p className="section-kicker">PROPERTY OWNER DASHBOARD</p>
        <h1>{user ? "Your rental business." : "Let people discover your space."}</h1>
        <p>{user ? "Manage properties, renter conversations, occupancy and recorded rent in one place." : "Publish a space and manage its availability."}</p>
      </div>
      <GuideNudge audience="owner" compact />
      {!user ? (
        <div className="info-card">
          <h2>What owners will get</h2>
          <div className="info-step"><Building2 size={22}/><p>Publish property details, rent and location, then manage inquiries in HomeTayo.</p></div>
          <div className="info-step"><ShieldCheck size={22}/><p>Owners publish their own listings. HomeTayo can remove listings that violate its rules.</p></div>
          {authIsConfigured() ? <Link className="button button-primary bottom-link" href="/sign-in">Sign in or create account <ArrowRight size={17}/></Link> : <div className="status-notice">Owner sign-in is unavailable until authentication is configured.</div>}
        </div>
      ) : (
        <>
          {params.submitted === "1" && <div className="status-notice">Your rental is published. Renters can now find it.</div>}
          {params.updated === "1" && <div className="status-notice">Your rental posting was updated.</div>}
          <div className="owner-toolbar"><span>Welcome, {user.displayName || user.email}</span><div className="owner-actions"><Link href="/inbox" className="button button-outline"><MessageCircle size={18}/> Messages & rent ledger</Link><Link href="/owner/listings/new" className="button button-primary"><Plus size={18}/> Submit a property</Link></div></div>
          <div className="workspace-stats" aria-label="Owner business overview">
            <div className="info-card"><span>Properties</span><strong>{owned.length}</strong></div>
            <div className="info-card"><span>Occupied units</span><strong>{finance.occupied}</strong></div>
            <div className="info-card"><span>Rent recorded this month</span><strong>{formatRent(finance.collected)}</strong></div>
            <div className="info-card"><span>Rent charged this month</span><strong>{formatRent(finance.expected)}</strong></div>
            <div className="info-card"><span>Outstanding through today</span><strong>{formatRent(finance.outstanding)}</strong></div>
            <div className="info-card"><span>Renter conversations</span><strong>{finance.conversations}</strong></div>
          </div>
          <div className="owner-quick-stats" aria-label="Listing status overview"><span><strong>{owned.filter(item=>item.status==="published").length}</strong> Live</span><span><strong>{owned.filter(item=>item.status==="paused").length}</strong> Unavailable</span><span><strong>{owned.filter(item=>["draft","pending_review"].includes(item.status)).length}</strong> Not published</span></div>
          <div className="admin-section-heading"><div><p className="section-kicker">YOUR PROPERTIES</p><h2>Manage your listings</h2></div></div>
          {owned.length === 0 ? <div className="info-card"><h2>No properties submitted yet</h2><p className="auth-security">Start by entering accurate details about a property you are authorized to list.</p><Link href="/owner/listings/new" className="button button-outline">Add first listing <ArrowRight size={17}/></Link></div> :
            <div className="owner-list">{owned.map((listing) => <article key={listing.id} className="owner-listing"><div>
              <span className="owner-status">{listing.status==="published"?"Available":listing.status==="paused"?"Unavailable":listing.status==="pending_review"?"Ready to publish":listing.status.replaceAll("_", " ")}</span>
              <h2>{listing.title}</h2><p>{formatRent(listing.monthlyRentCentavos)} / month</p>
              <div className="owner-actions"><Link href={`/owner/listings/${listing.id}/edit`} className="button button-outline"><Pencil size={16}/> Edit posting</Link><Link href={`/owner/listings/${listing.id}/units`} className="button button-outline"><Building2 size={16}/> Rooms, location & photos</Link>{listing.status === "published" && <Link href={"/rentals/" + listing.slug} className="button button-outline">Preview public listing <ArrowRight size={16}/></Link>}</div>
            </div><div className="owner-actions">{["draft","pending_review","paused"].includes(listing.status)&&<form action={publishProperty}><input type="hidden" name="id" value={listing.id}/><button className="button button-primary">{listing.status==="paused"?"Make available again":"Publish rental"}</button></form>}{listing.status === "published"&&<form action={pauseProperty}><input type="hidden" name="id" value={listing.id}/><button className="button button-outline" type="submit">Mark unavailable</button></form>}</div></article>)}</div>}
          <div className="status-notice"><Wallet size={16} style={{display:"inline"}}/> Income figures use payments owners record in HomeTayo. HomeTayo does not process or verify the transfer itself.</div>
          <p className="owner-disclaimer"><UsersRound size={16}/> Manage renter conversations and detailed ledgers from Messages & rent ledger. Only advertise property you own or have permission to list.</p>
        </>
      )}
    </section>
  );
}
