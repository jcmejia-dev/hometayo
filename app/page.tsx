import Link from "next/link";
import {
  ArrowRight, ArrowUpRight, BadgeCheck, BedDouble, Building2,
  Heart, House, MapPin, SearchCheck, ShieldCheck, Sparkles, Users, Compass, HousePlus,
} from "lucide-react";
import { SearchForm } from "@/components/search-form";

export default function Home() {
  return (
    <>
      <section className="hero-section">
        <div className="container hero-grid">
          <div className="hero-copy">
            <div className="eyebrow"><span className="eyebrow-dot" /> MADE FOR RENTING IN THE PHILIPPINES</div>
            <h1>A better place to <span>find your place.</span></h1>
            <p className="hero-description">Looking for a family home, a quiet apartment, or an affordable bedspace? A simpler rental search starts here.</p>
            <SearchForm />
            <div className="launch-note"><span className="pulse-dot" /> Starting in Koronadal City · Prelaunch preview</div>
          </div>
          <div className="hero-art" aria-hidden="true">
            <div className="orb orb-one" />
            <div className="orb orb-two" />
            <div className="illustration-card">
              <div className="illustration-topbar"><span className="illus-mark"><House size={19} /></span><span>Space to call your own</span><span className="illus-dots">•••</span></div>
              <div className="building-scene">
                <div className="sun-circle" />
                <div className="building building-back"><span /><span /><span /><span /></div>
                <div className="building building-front"><div className="building-roof" /><div className="window-row"><i /><i /></div><div className="window-row"><i /><i /></div><div className="front-door" /></div>
                <div className="tree tree-left" /><div className="tree tree-right" /><div className="ground" />
              </div>
              <div className="illustration-footer"><div><span className="tiny-label">YOUR NEXT CHAPTER</span><strong>Begins at home.</strong></div><div className="round-arrow"><ArrowUpRight size={21} /></div></div>
            </div>
            <div className="float-tag float-tag-top"><span className="tag-icon"><Heart size={18} fill="currentColor" /></span> Find your kind of home</div>
            <div className="float-tag float-tag-bottom"><MapPin size={17} /> Starting local, growing together</div>
          </div>
        </div>
      </section>

      <section className="features-strip">
        <div className="container features-grid">
          <span><SearchCheck size={19} /> Search by what matters</span>
          <span><ShieldCheck size={19} /> Clearer listing information</span>
          <span><Users size={19} /> Built for local communities</span>
        </div>
      </section>

      <section className="container home-choose-path" aria-labelledby="home-path-title">
        <div className="home-path-heading">
          <span className="section-kicker">NEW TO HOMETAYO?</span>
          <h2 id="home-path-title">What brings you here?</h2>
          <p>We'll help you get started, whether you're looking for a place or sharing one.</p>
        </div>
        <div className="home-path-grid">
          <Link href="/how-it-works#renters" className="home-path-card">
            <span className="home-path-symbol"><Compass size={27}/></span>
            <span className="home-path-words"><strong>I'm looking for a home</strong><small>Learn to search and contact owners safely</small></span>
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

      <section className="steps-section" id="how-it-works">
        <div className="container steps-grid">
          <div className="steps-title"><p className="section-kicker">THE HOMETAYO WAY</p><h2>Renting shouldn&apos;t feel like a guessing game.</h2><p>We&apos;re building a more organized way to search, connect, and settle in — without scrolling through endless posts.</p><Link href="/rentals" className="button button-primary">Start exploring <ArrowRight size={18} /></Link></div>
          <div className="steps-list">
            <div><span className="step-count">01</span><div><h3>Tell us what you need</h3><p>Choose a location, rental type, monthly budget, and the space you need.</p></div></div>
            <div><span className="step-count">02</span><div><h3>See the important details</h3><p>Review the rental price, location, description and availability when an approved listing is available.</p></div></div>
            <div><span className="step-count">03</span><div><h3>Connect with the owner</h3><p>Get in touch using an owner-approved contact method. No surprise booking fees.</p></div></div>
          </div>
        </div>
      </section>

      <section className="container owner-section">
        <div className="owner-banner"><div className="owner-symbol"><BadgeCheck size={32} /></div><div><p className="section-kicker">FOR PROPERTY OWNERS</p><h2>Have a place to rent out?</h2><p>Help people find your available space. Keep sharing on Facebook, with a cleaner listing page when our pilot opens.</p></div><Link href="/owner" className="button button-light">Learn about listing <ArrowUpRight size={18} /></Link></div>
      </section>

      <section className="container pilot-banner"><Sparkles size={20} /><p><strong>We&apos;re just getting started.</strong> HomeTayo is in development, beginning with Koronadal City. Public results depend on genuine, admin-approved listings. Some features are still in progress.</p></section>
    </>
  );
}
