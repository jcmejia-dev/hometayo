import Link from "next/link";
import { ArrowUpRight, BedDouble, Building2, House, Users, Compass, HousePlus, Sparkles } from "lucide-react";
import { SearchForm } from "@/components/search-form";
import { MarketplacePreview } from "@/components/marketplace-preview";

export default function Home() {
  return (
    <>
      <section className="hero-section">
        <div className="container hero-grid">
          <div className="hero-copy">
            <div className="eyebrow"><span className="eyebrow-dot" /> MADE FOR RENTING IN THE PHILIPPINES</div>
            <h1>A better place to <span>find your place.</span></h1>
            <p className="hero-description">Looking for a family home, a quiet apartment, or an affordable bedspace? Search local rentals in one place.</p>
            <SearchForm />
            <div className="launch-note"><span className="pulse-dot" /> Starting in Koronadal City · Prelaunch preview</div>
          </div>
          <MarketplacePreview />
        </div>
      </section>

      <section className="container home-choose-path" aria-labelledby="home-path-title">
        <div className="home-path-heading">
          <span className="section-kicker">NEW TO HOMETAYO?</span>
          <h2 id="home-path-title">What brings you here?</h2>
          <p>We&apos;ll help you get started, whether you&apos;re looking for a place or sharing one.</p>
        </div>
        <div className="home-path-grid">
          <Link href="/how-it-works#renters" className="home-path-card">
            <span className="home-path-symbol"><Compass size={27}/></span>
            <span className="home-path-words"><strong>I&apos;m looking for a home</strong><small>Learn to search and contact owners safely</small></span>
            <ArrowUpRight size={19} aria-hidden="true"/>
          </Link>
          <Link href="/how-it-works#owners" className="home-path-card">
            <span className="home-path-symbol"><HousePlus size={27}/></span>
            <span className="home-path-words"><strong>I want to list a property</strong><small>Learn how submissions and approval work</small></span>
            <ArrowUpRight size={19} aria-hidden="true"/>
          </Link>
        </div>
      </section>
      <section className="categories-section container" id="categories">
        <div className="section-heading"><div><p className="section-kicker">FIND YOUR FIT</p><h2>A space for every story.</h2><p>From a first bedspace to a new family home.</p></div><Link href="/rentals" className="text-link">Explore rentals <ArrowUpRight size={18} /></Link></div>
        <div className="category-grid">
          <Link href="/rentals?type=house" className="category-card card-house"><span className="category-icon"><House size={27} /></span><span><strong>Houses</strong><small>Room to grow together</small></span><ArrowUpRight size={19} /></Link>
          <Link href="/rentals?type=apartment" className="category-card card-apartment"><span className="category-icon"><Building2 size={27} /></span><span><strong>Apartments</strong><small>Your own cozy corner</small></span><ArrowUpRight size={19} /></Link>
          <Link href="/rentals?type=boarding_house" className="category-card card-boarding"><span className="category-icon"><BedDouble size={27} /></span><span><strong>Boarding houses</strong><small>Simple and practical</small></span><ArrowUpRight size={19} /></Link>
          <Link href="/rentals?type=bedspace" className="category-card card-bed"><span className="category-icon"><Users size={27} /></span><span><strong>Bedspaces</strong><small>Start somewhere new</small></span><ArrowUpRight size={19} /></Link>
        </div>
      </section>

      <section className="container pilot-banner"><Sparkles size={20} /><p><strong>We&apos;re just getting started.</strong> HomeTayo is in development, beginning with Koronadal City. Public results depend on genuine, admin-approved listings. Some features are still in progress.</p></section>
    </>
  );
}
