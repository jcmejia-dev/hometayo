import Link from "next/link";
import { ArrowUpRight, BedDouble, Building2, Compass, House, HousePlus, MapPin, Users } from "lucide-react";
import { SearchForm } from "@/components/search-form";
import { MarketplacePreview } from "@/components/marketplace-preview";

export default function Home() {
  return (
    <>
      <section className="hero-section">
        <div className="container hero-grid">
          <div className="hero-copy">
            <div className="eyebrow"><span className="eyebrow-dot"/> KORONADAL RENTAL PILOT</div>
            <h1>A better place to <span>find your place.</span></h1>
            <p className="hero-description">Search homes, apartments, and bedspaces in one place.</p>
            <SearchForm />
            <div className="launch-note"><MapPin size={13}/> Koronadal City · Prelaunch preview</div>
          </div>
          <MarketplacePreview />
        </div>
      </section>

      <section className="container categories-section" id="categories" aria-labelledby="categories-heading">
        <div className="section-heading">
          <div><p className="section-kicker">BROWSE BY TYPE</p><h2 id="categories-heading">Find your fit.</h2></div>
          <Link href="/rentals" className="text-link">All rentals <ArrowUpRight size={16}/></Link>
        </div>
        <div className="category-grid">
          <Link href="/rentals?type=house" className="category-card card-house"><span className="category-icon"><House size={22}/></span><span><strong>Houses</strong><small>Room to grow together</small></span><ArrowUpRight size={16}/></Link>
          <Link href="/rentals?type=apartment" className="category-card card-apartment"><span className="category-icon"><Building2 size={22}/></span><span><strong>Apartments</strong><small>Private living</small></span><ArrowUpRight size={16}/></Link>
          <Link href="/rentals?type=boarding_house" className="category-card card-boarding"><span className="category-icon"><BedDouble size={22}/></span><span><strong>Boarding houses</strong><small>Simple and practical</small></span><ArrowUpRight size={16}/></Link>
          <Link href="/rentals?type=bedspace" className="category-card card-bed"><span className="category-icon"><Users size={22}/></span><span><strong>Bedspaces</strong><small>Start somewhere new</small></span><ArrowUpRight size={16}/></Link>
        </div>
      </section>

      <section className="container home-choose-path" aria-labelledby="home-path-title">
        <div className="home-path-heading">
          <h2 id="home-path-title">What brings you here?</h2>
          <p>Choose a quick start. Detailed instructions live in the guide.</p>
        </div>
        <div className="home-path-grid">
          <Link href="/how-it-works#renters" className="home-path-card">
            <span className="home-path-symbol"><Compass size={22}/></span>
            <span className="home-path-words"><strong>I&apos;m looking for a home</strong><small>Learn to search and contact owners safely</small></span>
            <ArrowUpRight size={18} aria-hidden="true"/>
          </Link>
          <Link href="/how-it-works#owners" className="home-path-card">
            <span className="home-path-symbol"><HousePlus size={22}/></span>
            <span className="home-path-words"><strong>I want to list a property</strong><small>Learn how submissions and approval work</small></span>
            <ArrowUpRight size={18} aria-hidden="true"/>
          </Link>
        </div>
      </section>

      <section className="container pilot-banner">
        <p><strong>Early access:</strong> HomeTayo is still growing in Koronadal City. Only approved, genuine listings appear in rental results. <Link href="/safety" className="text-link">Rental safety <ArrowUpRight size={15}/></Link></p>
      </section>
    </>
  );
}
