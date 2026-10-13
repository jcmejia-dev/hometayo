import Link from "next/link";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { ArrowRight, House, LockKeyhole, MapPin, Settings2, ShieldCheck, UserRound } from "lucide-react";
import { authIsConfigured, signOut } from "@/auth";
import { users } from "@/db/schema";
import { getDatabase } from "@/lib/db";
import { currentUser } from "@/lib/session-user";
import { updateProfile } from "./actions";

export const dynamic = "force-dynamic";
export default async function ProfilePage({ searchParams }: { searchParams: Promise<{saved?:string}> }) {
  if (!authIsConfigured()) return <section className="container interior-page narrow-page"><div className="info-card"><h1>Profile setup unavailable</h1><p>Google login and Neon must be configured before profile settings can be used.</p><Link className="button button-outline" href="/">Return home</Link></div></section>;
  const account = await currentUser();
  if (!account) redirect("/sign-in");
  const db = getDatabase();
  if (!db) throw new Error("Database is not configured.");
  const [profile] = await db.select({
    preferredName: users.preferredName,
    homeCity: users.homeCity,
    preferredPropertyType: users.preferredPropertyType,
    preferredBudgetPesos: users.preferredBudgetPesos,
    createdAt: users.createdAt,
  }).from(users).where(eq(users.id, account.id)).limit(1);
  if (!profile) redirect("/sign-in");
  const { saved } = await searchParams;
  const query = new URLSearchParams();
  if (profile.homeCity) query.set("city",profile.homeCity);
  if (profile.preferredPropertyType) query.set("type",profile.preferredPropertyType);
  if (profile.preferredBudgetPesos) query.set("maxRent",String(profile.preferredBudgetPesos));
  const browse = "/rentals" + (query.size ? "?" + query.toString() : "");

  return (
    <section className="container interior-page profile-page">
      <div className="profile-heading">
        <div>
          <p className="section-kicker">YOUR HOME, YOUR SETTINGS</p>
          <h1>My profile</h1>
          <p>Manage your preferences and choose how you explore HomeTayo.</p>
        </div>
        <span className="profile-avatar"><UserRound size={34}/></span>
      </div>
      {saved === "1" && <div className="profile-saved" role="status"><ShieldCheck size={18}/> Your preferences were saved.</div>}
      <div className="profile-grid">
        <div className="profile-primary">
          <form action={updateProfile} className="info-card profile-form">
            <div className="profile-section-title"><Settings2 size={21}/><h2>Personal settings</h2></div>
            <p className="profile-help">Your preferred name and search preferences stay in your HomeTayo account. Your Google email is managed by Google.</p>
            <div className="profile-fields-grid">
            <label>Display name <input name="preferredName" minLength={2} maxLength={80} defaultValue={profile.preferredName ?? ""} placeholder={account.displayName ?? "What should we call you?"}/></label>
            <label>Preferred location <input name="homeCity" minLength={2} maxLength={80} defaultValue={profile.homeCity ?? ""} placeholder="e.g. Koronadal City"/></label>
            <label>Preferred property type <select name="preferredPropertyType" defaultValue={profile.preferredPropertyType ?? ""}>
              <option value="">Any type</option>
              <option value="house">House</option>
              <option value="apartment">Apartment</option>
              <option value="boarding_house">Boarding house</option>
              <option value="bedspace">Bedspace</option>
            </select></label>
            <label>Preferred maximum rent (₱/month) <input name="preferredBudgetPesos" type="number" min={100} max={5000000} step={1} defaultValue={profile.preferredBudgetPesos ?? ""} placeholder="Optional"/></label>
            </div>
            <button className="button button-primary profile-save" type="submit">Save preferences</button>
          </form>
          <details className="info-card profile-account" aria-label="Account and security">
            <summary className="profile-account-summary"><LockKeyhole size={21}/><strong>Account and security</strong><span>View</span></summary>
            <dl className="profile-details">
              <div><dt>Google account</dt><dd>{account.email}</dd></div>
              <div><dt>Access role</dt><dd>{account.role === "admin" ? "Administrator" : account.role === "moderator" ? "Moderator" : "Member"}</dd></div>
              <div><dt>Member since</dt><dd>{new Intl.DateTimeFormat("en-PH",{dateStyle:"medium",timeZone:"Asia/Manila"}).format(profile.createdAt)}</dd></div>
            </dl>
            <p className="profile-help">You cannot change your email or grant yourself an administrator role here. HomeTayo never stores your Google password.</p>
            <form action={async () => { "use server"; await signOut({redirectTo:"/sign-in"}); }}>
              <button className="button button-outline" type="submit">Sign out</button>
            </form>
          </details>
        </div>
        <aside className="profile-side" aria-label="Quick links">
          <div className="profile-side-card"><MapPin size={22}/><h2>Find a place</h2><p>Search using your saved preferences.</p><Link href={browse} className="button button-outline">Browse with preferences <ArrowRight size={16}/></Link></div>
          <div className="profile-side-card"><House size={22}/><h2>Have a rental?</h2><p>Manage your properties.</p><Link href="/owner" className="button button-outline">Owner dashboard <ArrowRight size={16}/></Link></div>
          {account.role === "admin" || account.role === "moderator" ? (
            <div className="profile-side-card profile-admin-link"><ShieldCheck size={22}/><h2>Platform operations</h2><p>Moderate the marketplace.</p><Link href="/admin" className="button button-primary">Admin dashboard <ArrowRight size={16}/></Link></div>
          ) : null}
        </aside>
      </div>
    </section>
  );
}
