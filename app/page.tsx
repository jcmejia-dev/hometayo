import Link from "next/link";
import { ArrowUpRight, BedDouble, Building2, House, Users, ShieldCheck } from "lucide-react";
import { SearchForm } from "@/components/search-form";
import { FeaturedRentalsPanel } from "@/components/featured-rentals";
import { getLatestPublishedListings } from "@/lib/listings";
import { FirstVisitIntro } from "@/components/first-visit-intro";
import { currentUser } from "@/lib/session-user";

export const dynamic = "force-dynamic";

export default async function Home({ searchParams }:{searchParams:Promise<{intro?:string}>}) {
  const [latest, params, user] = await Promise.all([getLatestPublishedListings(), searchParams, currentUser()]);
  return (
    <>
      {params.intro === "1" && <FirstVisitIntro forceOpen/>}
      <section className="hero-section">
        <div className="container hero-grid">
          <div className="hero-copy">
            <div className="eyebrow">HANAP BAHAY. DITO TAYO.</div>
            <h1>Find a place <span>to call home.</span></h1>
            <p className="hero-description">Homes, rooms and bedspaces, all in one place. Find a rental that fits your life in Koronadal.</p>
            {user ? <p className="launch-note">Welcome back, {user.displayName || "neighbor"}. <Link href="/profile" className="text-link">My profile</Link></p> : <div className="welcome-entry-actions">
              <Link className="button button-primary" href="/sign-up">Get started</Link>
              <Link className="text-link" href="/sign-in">Sign in</Link>
            </div>}
          </div>
          <FeaturedRentalsPanel result={latest} />
        </div>
      </section>
      <section className="container home-search" aria-label="Find a rental"><SearchForm/></section>

      {!user && <section className="container web-purpose-section" aria-label="What HomeTayo does">
        <div><p className="section-kicker">ONE COMMUNITY. TWO WAYS TO BELONG.</p><h2>A home for renters.<br/>A place for your rental.</h2><p>Discover what fits your next chapter, with clear details and listings reviewed before publication.</p></div>
        <article><House size={28}/><h3>Looking for a home?</h3><p>Search by location, property type and budget. Review the details and contact the owner.</p><Link href="/sign-up?audience=renter" className="text-link">Join as a renter <ArrowUpRight size={16}/></Link></article>
        <article><Building2 size={28}/><h3>Have a space to rent?</h3><p>Submit your property for review, track its status and manage its availability.</p><Link href="/sign-up?audience=owner" className="text-link">Join as a property owner <ArrowUpRight size={16}/></Link></article>
      </section>}

      <section className="categories-section container" id="categories">
        <div className="section-heading"><div><p className="section-kicker">EXPLORE BY TYPE</p><h2>What are you looking for?</h2></div><Link href="/rentals" className="text-link">See all rentals <ArrowUpRight size={18}/></Link></div>
        <div className="category-grid">
          <Link href="/rentals?type=house" className="category-card card-house"><span className="category-icon"><House size={27} /></span><span><strong>Houses</strong><small>Room to grow together</small></span><ArrowUpRight size={19} /></Link>
          <Link href="/rentals?type=apartment" className="category-card card-apartment"><span className="category-icon"><Building2 size={27} /></span><span><strong>Apartments</strong><small>Your own cozy corner</small></span><ArrowUpRight size={19} /></Link>
          <Link href="/rentals?type=boarding_house" className="category-card card-boarding"><span className="category-icon"><BedDouble size={27} /></span><span><strong>Boarding houses</strong><small>Simple and practical</small></span><ArrowUpRight size={19} /></Link>
          <Link href="/rentals?type=bedspace" className="category-card card-bed"><span className="category-icon"><Users size={27} /></span><span><strong>Bedspaces</strong><small>Start somewhere new</small></span><ArrowUpRight size={19} /></Link>
        </div>
      </section>

      <section className="container pilot-banner"><ShieldCheck size={20}/><p>Listings are reviewed before publication. Always verify the property and owner independently.</p><Link href="/owner" className="text-link">List a property <ArrowUpRight size={16}/></Link></section>
    </>
  );
}
