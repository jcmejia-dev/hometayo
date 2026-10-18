import {canAdminister} from "@/lib/admin-owner";
import {signIn} from "@/auth";
import {EmailLoginForm} from "@/components/auth-forms";
import {loginAdministrator} from "./actions";
import {emailPasswordSignInConfigured,googleSignInConfigured} from "@/lib/email-auth";
import Link from "next/link";
import {notFound} from "next/navigation";
import {ArrowLeft,ClipboardCheck,Flag,ShieldCheck,UserRoundX} from "lucide-react";
import {desc,eq,sql} from "drizzle-orm";
import {currentUser} from "@/lib/session-user";
import {getDatabase} from "@/lib/db";
import {listings} from "@/db/schema";
import {moderateAccount,reviewProperty,reviewSafetyReport} from "../admin/actions";
import {formatRent} from "@/lib/search-filters";
import {AdminOverview} from "@/components/admin-overview";

export const dynamic="force-dynamic";
type SafetyRow={id:string;category:string;details:string;status:string;created_at:Date;reporter_name:string|null;target_name:string|null;target_user_id:string|null;target_status:string|null;listing_title:string|null;message_body:string|null};
export default async function AdminPage(){
 const user=await currentUser();
 if(!user)return <section className="container interior-page narrow-page"><div className="info-card"><p className="section-kicker">PRIVATE ACCESS</p><h1>Administrator sign in</h1><p>Use your existing verified HomeTayo account.</p><EmailLoginForm enabled={emailPasswordSignInConfigured()} loginAction={loginAdministrator}/>{googleSignInConfigured()&&<form action={async()=>{"use server";await signIn("google",{redirectTo:"/administratorsite"});}}><button className="auth-google-button" type="submit">Continue with Google</button></form>}<p>Need an account first? <Link href="/sign-up">Create a HomeTayo account</Link></p></div></section>;
 if(!canAdminister(user))notFound();
 const db=getDatabase();if(!db)throw new Error("Database not configured.");
 const [submissions,published]=await Promise.all([
  db.select({id:listings.id,title:listings.title,description:listings.description,city:listings.city,barangay:listings.barangay,monthlyRentCentavos:listings.monthlyRentCentavos,propertyType:listings.propertyType,createdAt:listings.createdAt}).from(listings).where(eq(listings.status,"pending_review")).orderBy(desc(listings.createdAt)).limit(50),
  db.select({id:listings.id,title:listings.title,slug:listings.slug}).from(listings).where(eq(listings.status,"published")).orderBy(desc(listings.createdAt)).limit(100),
 ]);
 let reports:SafetyRow[]=[];let safetyReady=true;
 try{const safetyResult=await db.execute(sql`SELECT sr.id,sr.category,sr.details,sr.status,sr.created_at,
   COALESCE(reporter.preferred_name,reporter.display_name,reporter.email) AS reporter_name,
   COALESCE(target.preferred_name,target.display_name,target.email) AS target_name,sr.target_user_id,
   COALESCE(target.account_status,'active') AS target_status,l.title AS listing_title,m.body AS message_body
  FROM safety_reports sr JOIN users reporter ON reporter.id=sr.reporter_id LEFT JOIN users target ON target.id=sr.target_user_id
  LEFT JOIN listings l ON l.id=sr.listing_id LEFT JOIN rental_messages m ON m.id=sr.message_id
  ORDER BY CASE sr.status WHEN 'open' THEN 0 WHEN 'reviewed' THEN 1 ELSE 2 END,sr.created_at DESC LIMIT 100`);reports=safetyResult.rows as unknown as SafetyRow[];}
 catch{safetyReady=false;}
 return <section className="container interior-page admin-control-page">
  <Link href="/" className="back-link"><ArrowLeft size={17}/> HomeTayo</Link>
  <div className="interior-heading"><span className="page-icon"><ClipboardCheck size={27}/></span><p className="section-kicker">MODERATION & SAFETY</p><h1>Admin dashboard</h1><p>Review renter reports, moderate accounts, and remove unsafe listings.</p></div>
  <AdminOverview/>
  <section className="info-card">
   <div className="admin-data-heading"><Flag size={20}/><h2>Safety reports</h2></div><p>Reports from renters and owners appear here with the linked account, listing, or message.</p>
   {!safetyReady&&<p className="status-notice">Safety reporting is awaiting database migration 008. Existing listing moderation remains available below.</p>}
   {safetyReady&&!reports.length&&<p>No safety reports yet.</p>}
   <div className="owner-list">{reports.map(report=><article className="owner-listing admin-listing" key={report.id}><div>
    <span className="owner-status">{report.status} · {report.category.replaceAll("_"," ")}</span><h3>{report.target_name||"Reported account"}</h3>
    <p>Reported by {report.reporter_name||"HomeTayo member"} · {new Intl.DateTimeFormat("en-PH",{dateStyle:"medium",timeStyle:"short",timeZone:"Asia/Manila"}).format(new Date(report.created_at))}</p>
    {report.listing_title&&<p><strong>Listing:</strong> {report.listing_title}</p>}{report.message_body&&<p><strong>Reported message:</strong> “{report.message_body.slice(0,280)}”</p>}{report.details&&<p><strong>Report:</strong> {report.details}</p>}
    {report.target_user_id&&<p>Account status: <strong>{report.target_status||"active"}</strong></p>}
   </div><div className="review-actions">
    {report.target_user_id&&<><form action={moderateAccount}><input type="hidden" name="userId" value={report.target_user_id}/><input type="hidden" name="status" value="flagged"/><button className="button button-outline">Flag account</button></form><form action={moderateAccount}><input type="hidden" name="userId" value={report.target_user_id}/><input type="hidden" name="status" value="banned"/><button className="button button-outline"><UserRoundX size={16}/> Ban account</button></form>{report.target_status!=="active"&&<form action={moderateAccount}><input type="hidden" name="userId" value={report.target_user_id}/><input type="hidden" name="status" value="active"/><button className="button button-outline">Restore account</button></form>}</>}
    <form action={reviewSafetyReport}><input type="hidden" name="reportId" value={report.id}/><select name="status" defaultValue={report.status==="open"?"reviewed":report.status}><option value="reviewed">Reviewed</option><option value="actioned">Action taken</option><option value="dismissed">Dismiss</option></select><input name="note" maxLength={1000} placeholder="Admin note (optional)"/><button className="button button-primary">Save report decision</button></form>
   </div></article>)}</div>
  </section>
  <section className="info-card"><h2>Published rentals</h2><p>Remove a listing from public search when it violates platform rules.</p>{!published.length&&<p>No published rentals yet.</p>}{published.map(item=><article className="owner-listing" key={item.id}><div><h3>{item.title}</h3><Link href={`/rentals/${item.slug}`} className="text-link">View listing</Link></div><form action={reviewProperty} className="review-actions"><input type="hidden" name="id" value={item.id}/><input type="hidden" name="decision" value="removed"/><label>Removal reason<input name="reason" required minLength={5} maxLength={500}/></label><button className="button button-outline">Remove listing</button></form></article>)}</section>
  <div className="admin-section-heading admin-review-queue-heading"><div><p className="section-kicker">NEEDS YOUR ATTENTION</p><h2>Rental review queue</h2></div></div>
  {submissions.length===0&&<div className="info-card"><h2>You&apos;re all caught up.</h2><p>No rental submissions are waiting for review.</p></div>}
  <div className="owner-list">{submissions.map(item=><article key={item.id} className="owner-listing admin-listing"><div><span className="owner-status">{item.propertyType.replaceAll("_"," ")}</span><h2>{item.title}</h2><p>{item.barangay}, {item.city} · {formatRent(item.monthlyRentCentavos)}/month</p><p className="admin-description">{item.description}</p><p className="owner-disclaimer"><ShieldCheck size={15}/> Verify the owner&apos;s authority before approving.</p></div><div className="review-actions"><form action={reviewProperty}><input type="hidden" name="id" value={item.id}/><input type="hidden" name="decision" value="approved"/><button type="submit" className="button button-primary">Approve</button></form><form action={reviewProperty}><input type="hidden" name="id" value={item.id}/><input type="hidden" name="decision" value="rejected"/><input name="reason" aria-label="Rejection reason" required minLength={5} maxLength={500} placeholder="Reason for rejection"/><button type="submit" className="button button-outline">Reject</button></form></div></article>)}</div>
 </section>;
}
