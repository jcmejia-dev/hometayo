import Link from "next/link";
import {
  ArrowRight,
  Building2,
  CheckCircle2,
  Home as HomeIcon,
  MapPin,
  MessageCircle,
  Search,
  ShieldCheck,
  Smartphone,
  UsersRound,
} from "lucide-react";
import { getLatestPublishedListings } from "@/lib/listings";
import { FirstVisitIntro } from "@/components/first-visit-intro";
import { currentUser } from "@/lib/session-user";
import { RenterDashboard } from "@/components/renter-dashboard";
import { redirect } from "next/navigation";
import styles from "./landing.module.css";

export const dynamic = "force-dynamic";

export default async function Home({ searchParams }:{searchParams:Promise<{intro?:string}>}) {
  const [params, user] = await Promise.all([searchParams, currentUser()]);

  if (user?.role === "landlord" && params.intro !== "1") redirect("/owner");

  if (user?.role === "renter") {
    const latest = await getLatestPublishedListings();
    return <>{params.intro === "1" && <FirstVisitIntro forceOpen/>}<RenterDashboard name={user.displayName || "neighbor"} latest={latest}/></>;
  }

  return (
    <div className={styles.landing}>
      {params.intro === "1" && <FirstVisitIntro forceOpen/>}

      <section className={styles.hero}>
        <div className={`${styles.shell} ${styles.heroGrid}`}>
          <div className={styles.heroCopy}>
            <span className={styles.badge}><HomeIcon size={15}/> Built for renting in the Philippines</span>
            <h1>Finding a home should feel <span>simpler.</span></h1>
            <p>HomeTayo brings renters and property owners into one clear, familiar place—so finding, publishing and talking about a rental feels less complicated.</p>
            <div className={styles.actions}>
              <Link href="/sign-up" className={styles.primary}>Create your account <ArrowRight size={18}/></Link>
              <Link href="/sign-in" className={styles.secondary}>I already have an account</Link>
            </div>
            <div className={styles.trustRow}>
              <span><CheckCircle2 size={15}/> Renter and owner accounts</span>
              <span><CheckCircle2 size={15}/> Owner-published rentals</span>
              <span><CheckCircle2 size={15}/> Android access</span>
            </div>
          </div>

          <div className={styles.previewWrap} aria-label="HomeTayo product preview">
            <span className={styles.previewGlow} aria-hidden="true"/>
            <div className={styles.preview}>
              <div className={styles.previewTop}>
                <div className={styles.previewBrand}><span className={styles.previewMark}/>HomeTayo</div>
                <small>HANAP BAHAY. DITO TAYO.</small>
              </div>
              <div className={styles.previewHero}>
                <small>ONE PLACE TO START</small>
                <strong>A clearer way to rent and be found.</strong>
              </div>
              <div className={styles.previewCards}>
                <div className={styles.previewCard}>
                  <span className={styles.previewIcon}><Search size={19}/></span>
                  <strong>Discover</strong>
                  <p>Search with useful rental details after you sign in.</p>
                </div>
                <div className={styles.previewCard}>
                  <span className={styles.previewIcon}><MessageCircle size={19}/></span>
                  <strong>Connect</strong>
                  <p>Keep renter and owner conversations in one place.</p>
                </div>
                <div className={`${styles.previewCard} ${styles.previewCardWide}`}>
                  <span className={styles.previewIcon}><Building2 size={19}/></span>
                  <div><strong>Manage</strong><p>Owners can publish and manage their rental presence from HomeTayo.</p></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className={styles.introStrip}>
        <div className={`${styles.shell} ${styles.introStripInner}`}>
          <strong>HomeTayo is not just a listing page.</strong>
          <span>It is a rental discovery and property-management space designed around the way people actually look for a place to live.</span>
          <span>Start in Koronadal. Built with the Philippines in mind.</span>
        </div>
      </div>

      <section className={styles.section}>
        <div className={styles.shell}>
          <div className={styles.sectionHead}>
            <p className={styles.kicker}>WHAT HOMETAYO DOES</p>
            <h2>One platform. Two sides of the same move.</h2>
            <p>Renters need clarity. Owners need a practical way to publish and manage. HomeTayo gives both sides a focused place to start.</p>
          </div>
          <div className={styles.featureGrid}>
            <article className={styles.featureCard}>
              <span><MapPin size={22}/></span>
              <h3>Discover with context</h3>
              <p>Explore rental options by location, type and budget instead of jumping between scattered posts.</p>
            </article>
            <article className={styles.featureCard}>
              <span><MessageCircle size={22}/></span>
              <h3>Connect in one place</h3>
              <p>Keep rental conversations connected to the property and the people involved.</p>
            </article>
            <article className={styles.featureCard}>
              <span><UsersRound size={22}/></span>
              <h3>Built for renters and owners</h3>
              <p>Choose the account that matches what you need now, while HomeTayo keeps the experience familiar.</p>
            </article>
          </div>
        </div>
      </section>

      <section className={`${styles.section} ${styles.sectionAlt}`}>
        <div className={styles.shell}>
          <div className={styles.sectionHead}>
            <p className={styles.kicker}>HOW IT WORKS</p>
            <h2>From “where do I start?” to a place that makes sense.</h2>
          </div>
          <div className={styles.steps}>
            <article className={styles.step}><h3>Create your account</h3><p>Sign up and choose whether you are looking for a home or managing a property.</p></article>
            <article className={styles.step}><h3>Use the right workspace</h3><p>Renters get discovery tools. Property owners get publishing and rental-management tools.</p></article>
            <article className={styles.step}><h3>Move the conversation forward</h3><p>Review the details, connect, and independently verify a property before making commitments or payments.</p></article>
          </div>
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.shell}>
          <div className={styles.safety}>
            <span className={styles.safetyIcon}><ShieldCheck size={26}/></span>
            <div><h2>Trust starts with clear expectations.</h2><p>Owner-published does not mean independently verified. HomeTayo encourages renters to inspect the property, confirm the owner and verify details before sending money.</p></div>
            <Link href="/safety" className={styles.safetyLink}>Read rental safety <ArrowRight size={17}/></Link>
          </div>
        </div>
      </section>

      <section className={`${styles.section} ${styles.sectionAlt}`}>
        <div className={styles.shell}>
          <div className={styles.appCta}>
            <div>
              <p className={styles.kicker}>HOMETAYO FOR ANDROID</p>
              <h2>Take HomeTayo with you.</h2>
              <p>Install the Android app from the official HomeTayo download page. Your account unlocks the rental experience on the web and on Android.</p>
            </div>
            <Link href="/download" className={styles.primary}><Smartphone size={18}/> Install Android app</Link>
          </div>
        </div>
      </section>
    </div>
  );
}
