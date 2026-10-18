import {canAdminister} from "@/lib/admin-owner";
import {signIn} from "@/auth";
import {EmailLoginForm} from "@/components/auth-forms";
import {loginAdministrator} from "./actions";
import {emailPasswordSignInConfigured,googleSignInConfigured} from "@/lib/email-auth";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ClipboardCheck, ShieldCheck } from "lucide-react";
import { desc, eq } from "drizzle-orm";
import { currentUser } from "@/lib/session-user";
import { getDatabase } from "@/lib/db";
import { listings } from "@/db/schema";
import { reviewProperty } from "../admin/actions";
import { formatRent } from "@/lib/search-filters";
import { AdminOverview } from "@/components/admin-overview";

export const dynamic = "force-dynamic";
export default async function AdminPage() {
  const user = await currentUser();
  if(!user)return <section className="container interior-page narrow-page"><div className="info-card"><p className="section-kicker">PRIVATE ACCESS</p><h1>Administrator sign in</h1><p>Use your existing verified HomeTayo account.</p><EmailLoginForm enabled={emailPasswordSignInConfigured()} loginAction={loginAdministrator}/>{googleSignInConfigured()&&<form action={async()=>{"use server";await signIn("google",{redirectTo:"/administratorsite"});}}><button className="auth-google-button" type="submit">Continue with Google</button></form>}<p>Need an account first? <Link href="/sign-up">Create a HomeTayo account</Link></p></div></section>;
  if(!canAdminister(user))notFound();
  const db = getDatabase();
  if (!db) throw new Error("Database not configured.");
  const submissions = await db.select({
    id: listings.id, title: listings.title, description: listings.description,
    city: listings.city, barangay: listings.barangay,
    monthlyRentCentavos: listings.monthlyRentCentavos,
    propertyType: listings.propertyType, createdAt: listings.createdAt,
  }).from(listings).where(eq(listings.status, "pending_review")).orderBy(desc(listings.createdAt)).limit(50);
  const published=await db.select({id:listings.id,title:listings.title,slug:listings.slug}).from(listings).where(eq(listings.status,"published")).orderBy(desc(listings.createdAt)).limit(100);

  return (
    <section className="container interior-page admin-control-page">
      <Link href="/" className="back-link"><ArrowLeft size={17}/> HomeTayo</Link>
      <div className="interior-heading">
        <span className="page-icon"><ClipboardCheck size={27}/></span>
        <p className="section-kicker">MODERATION</p><h1>Admin dashboard</h1>
        <p>Owners publish directly. Moderate listings and manage platform operations.</p>
      </div>
      <AdminOverview />
      <section className="info-card"><h2>Published rentals</h2><p>Remove a listing from public search when it violates platform rules.</p>{!published.length&&<p>No published rentals yet.</p>}{published.map(item=><article className="owner-listing" key={item.id}><div><h3>{item.title}</h3><Link href={`/rentals/${item.slug}`} className="text-link">View listing</Link></div><form action={reviewProperty} className="review-actions"><input type="hidden" name="id" value={item.id}/><input type="hidden" name="decision" value="removed"/><label>Removal reason<input name="reason" required minLength={5} maxLength={500}/></label><button className="button button-outline">Remove listing</button></form></article>)}</section>
      <div className="admin-section-heading admin-review-queue-heading"><div><p className="section-kicker">NEEDS YOUR ATTENTION</p><h2>Rental review queue</h2></div></div>
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
