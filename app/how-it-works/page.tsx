import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight, BadgeCheck, BookOpenCheck, CircleHelp,
  ClipboardCheck, Compass, HousePlus, KeyRound, MapPin,
  Search, ShieldCheck, SlidersHorizontal, Sparkles, PlayCircle,
} from "lucide-react";

export const metadata: Metadata = {
  title: "How HomeTayo works",
  description: "A step-by-step guide for renters and property owners using HomeTayo's rental marketplace.",
};

const renterSteps = [
  { icon: MapPin, title: "Choose a location", body: "Start with Koronadal City, or enter the city or municipality where you want to rent. You do not need an account to search." },
  { icon: SlidersHorizontal, title: "Set your budget and space", body: "Filter by house, apartment, boarding house or bedspace, maximum monthly rent, and minimum bedrooms where applicable." },
  { icon: Search, title: "Review approved listings", body: "Open a listing to check its monthly rent, approximate location, description and last confirmed availability. New listings may take time to appear." },
  { icon: ShieldCheck, title: "Contact and verify independently", body: "If the owner has shared a public contact method, reach out directly. Verify the property, rental terms and the person offering it before paying." },
];

const ownerSteps = [
  { icon: KeyRound, title: "Sign in with Google", body: "Open the owner dashboard. You can use your regular Google account; you cannot choose admin privileges during sign-up." },
  { icon: HousePlus, title: "Submit accurate property details", body: "Enter the actual property type, city, barangay, monthly rent, description and public contact preference. Only list places you are authorized to advertise." },
  { icon: ClipboardCheck, title: "Wait for administrator review", body: "Your submission starts as Pending review. It does not appear to renters until an admin approves it. You can see its status in My Listings." },
  { icon: BadgeCheck, title: "Keep availability up to date", body: "After approval, your listing can appear in search. You can currently mark a published listing unavailable from your owner dashboard." },
];

export default function HowItWorks() {
  return (
    <div className="guide-page">
      <section className="guide-hero">
        <div className="container guide-hero-inner">
          <span className="guide-eyebrow"><BookOpenCheck size={16} /> YOUR HOMETAYO GUIDE</span>
          <h1>Find a home or list a place.<br/><span>Know exactly what to do.</span></h1>
          <p>New here? Choose your path below. We&apos;ll show you what works today, and what we&apos;re still building.</p>
          <Link href="/?intro=1" className="guide-replay-link"><PlayCircle size={17}/> Replay the introduction</Link>
          <div className="guide-role-grid" aria-label="Choose your HomeTayo guide">
            <a href="#renters" className="guide-role-card">
              <span className="guide-role-icon"><Compass size={25} /></span>
              <span className="guide-role-copy"><strong>I&apos;m looking for a home</strong><small>Step-by-step rental search guide</small></span>
              <ArrowRight size={21} aria-hidden="true"/>
            </a>
            <a href="#owners" className="guide-role-card">
              <span className="guide-role-icon"><HousePlus size={25} /></span>
              <span className="guide-role-copy"><strong>I have a property to rent</strong><small>Step-by-step landlord guide</small></span>
              <ArrowRight size={21} aria-hidden="true"/>
            </a>
          </div>
        </div>
      </section>

      <section className="container guide-section" id="renters" aria-labelledby="guide-renter-title">
        <div className="guide-section-head">
          <span className="guide-section-icon"><Compass size={28}/></span>
          <div>
            <p className="section-kicker">FOR PEOPLE LOOKING FOR A HOME</p>
            <h2 id="guide-renter-title">Renter guide</h2>
            <p>Search for a place that fits your needs, without having to sign in.</p>
          </div>
        </div>
        <div className="guide-step-grid">
          {renterSteps.map(({icon: Icon, title, body}, index) => (
            <article className="guide-step-card" key={title}>
              <div className="guide-step-top"><span className="guide-step-number">{String(index+1).padStart(2,"0")}</span><Icon size={22} aria-hidden="true"/></div>
              <h3>{title}</h3>
              <p>{body}</p>
            </article>
          ))}
        </div>
        <div className="guide-inline-action">
          <div><strong>Ready to explore?</strong><p>You&apos;ll see only admin-approved properties that match your filters. It&apos;s okay if there are no results yet.</p></div>
          <Link className="button button-primary" href="/rentals">Browse rentals <ArrowRight size={17}/></Link>
        </div>
      </section>

      <section className="guide-owner-zone" id="owners" aria-labelledby="guide-owner-title">
        <div className="container guide-section">
          <div className="guide-section-head">
            <span className="guide-section-icon guide-owner-icon"><HousePlus size={28}/></span>
            <div>
              <p className="section-kicker">FOR LANDLORDS AND PROPERTY OWNERS</p>
              <h2 id="guide-owner-title">Property owner guide</h2>
              <p>Share your authorized rental and follow its review status from one dashboard.</p>
            </div>
          </div>
          <div className="guide-step-grid">
            {ownerSteps.map(({icon: Icon, title, body}, index) => (
              <article className="guide-step-card" key={title}>
                <div className="guide-step-top"><span className="guide-step-number">{String(index+1).padStart(2,"0")}</span><Icon size={22} aria-hidden="true"/></div>
                <h3>{title}</h3>
                <p>{body}</p>
              </article>
            ))}
          </div>
          <div className="guide-inline-action">
            <div><strong>Have a place to list?</strong><p>Basic property submission is currently free. An administrator reviews every new listing before publication.</p></div>
            <Link className="button button-primary" href="/owner">Open owner dashboard <ArrowRight size={17}/></Link>
          </div>
        </div>
      </section>

      <section className="container guide-section guide-faq" aria-labelledby="guide-faq-title">
        <div className="guide-faq-title"><CircleHelp size={24}/><div><p className="section-kicker">GOOD TO KNOW</p><h2 id="guide-faq-title">A few common questions</h2></div></div>
        <div className="guide-faq-grid">
          <div><h3>Do renters need an account?</h3><p>No. Anyone can browse approved rental listings and use the filters. Saved searches and rental requests are planned, not active yet.</p></div>
          <div><h3>Are HomeTayo properties verified?</h3><p>Listings require admin approval before publication. That is not a guarantee of ownership, condition or safety. Please verify details independently.</p></div>
          <div><h3>Can owners upload photos or edit listings?</h3><p>Not yet. Those features are in development. The current form supports property details, and published listings can be marked unavailable.</p></div>
          <div><h3>Can anyone become an admin?</h3><p>No. Google sign-in alone does not grant administrator access. Administrative roles are controlled by HomeTayo on the server.</p></div>
        </div>
        <div className="guide-safety-note"><Sparkles size={21}/><p><strong>HomeTayo publishes approved listings as owners submit them.</strong> Availability depends on genuine, approved listings. For a safer search, review our <Link href="/safety">rental safety guide</Link>.</p></div>
      </section>
    </div>
  );
}
