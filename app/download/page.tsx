import Link from "next/link";
import {ArrowDown,ArrowRight,Check,Download,Home,MapPin,Search,ShieldCheck,Smartphone,SlidersHorizontal,ExternalLink} from "lucide-react";
import type {Metadata} from "next";
export const metadata:Metadata={title:"Take HomeTayo with you | Android app",description:"Download HomeTayo for Android, sign in to your account, and use the rental experience from your phone."};
const apkUrl="/download/HomeTayo.apk";
export default function DownloadPage(){
  return <div className="container app-download-page">
    <section className="app-download-hero" aria-label="Android app installation">
      <div className="app-download-copy">
        <span className="app-platform"><Smartphone size={15} aria-hidden="true"/> MADE FOR ANDROID</span>
        <h1>Your next home.<br/><span>Now in your pocket.</span></h1>
        <p>New neighbourhood. Fresh start. Install HomeTayo, sign in, and take your rental workspace with you.</p>
        <a className="app-download-cta" aria-label="Install Android app" href={apkUrl} rel="noreferrer"><Download size={20} aria-hidden="true"/><span>Install Android app<small>Download the official HomeTayo APK</small></span><ArrowDown size={20} aria-hidden="true"/></a>
        <span className="app-download-note"><Check size={14} aria-hidden="true"/> Free to download <span>·</span> Account required for rental features</span>
        <Link className="app-web-link" href="/sign-up">Create your HomeTayo account <ArrowRight size={16} aria-hidden="true"/></Link>
      </div>
      <div className="app-download-art" aria-label="Illustrated HomeTayo app preview">
        <span className="app-art-orbit app-art-orbit-one"/><span className="app-art-orbit app-art-orbit-two"/>
        <span className="app-floating-label"><MapPin size={18} aria-hidden="true"/> A little closer to home</span>
        <div className="app-preview-phone" aria-hidden="true">
          <div className="app-phone-camera"/><div className="app-phone-brand"><span/>Home<b>Tayo</b></div>
          <div className="app-phone-heading"><small>YOUR NEXT CHAPTER</small><strong>Find your place.</strong><span>Make room for new beginnings.</span></div>
          <div className="app-phone-search"><Search size={14}/> Where feels like home? <SlidersHorizontal size={14}/></div>
          <div className="app-phone-map"><svg viewBox="0 0 240 175" fill="none"><path d="M-10 40L250 120M40-10L145 190M-10 145L255 15M180-10L215 180" stroke="#FCFBF5" strokeWidth="14"/><path d="M-10 40L250 120M40-10L145 190M-10 145L255 15M180-10L215 180" stroke="#C6D5C4" strokeWidth="1" strokeDasharray="3 4"/></svg><span className="app-map-pin pin-one"><Home size={18}/></span><span className="app-map-pin pin-two"><Home size={16}/></span><span className="app-map-pin pin-three"><Home size={16}/></span><span className="app-map-you"/></div>
          <div className="app-phone-card"><span><Home size={26}/></span><div><small>A SPACE FOR YOUR STORY</small><strong>Room for what’s next.</strong><p>Rental tools after sign-in</p></div><ArrowRight size={16}/></div>
          <div className="app-phone-nav"><Home size={17}/><Search size={17}/><MapPin size={17}/><span/></div>
        </div>
        <span className="app-art-caption">A glimpse of your next chapter · Illustrated preview</span>
      </div>
    </section>
    <section className="app-benefits" aria-label="Use HomeTayo on Android">{[
      {Icon:MapPin,title:"Explore after sign-in",copy:"Use your renter account to discover locations and rental details."},
      {Icon:SlidersHorizontal,title:"Keep your workspace close",copy:"Access the HomeTayo tools designed for your renter or owner account."},
      {Icon:Home,title:"One account, web and Android",copy:"Create your account on HomeTayo, then use it wherever you prefer."},
    ].map(({Icon,title,copy})=><div key={title}><span><Icon size={21} aria-hidden="true"/></span><div><h2>{title}</h2><p>{copy}</p></div></div>)}</section>
    <section className="app-install-guide" aria-labelledby="app-install-heading"><div className="app-install-heading"><div><p className="section-kicker">A FEW TAPS. A FRESH START.</p><h2 id="app-install-heading">Make yourself at home.</h2></div><span><Smartphone size={16} aria-hidden="true"/> Android installation</span></div>
      <ol className="app-install-steps">{[{title:"Download",copy:"Tap Install Android app on your phone to save the APK."},{title:"Open the file",copy:"Find HomeTayo in your downloads and tap to open it."},{title:"Sign in",copy:"Confirm Install, open HomeTayo, and sign in to your account."}].map((step,i)=><li key={step.title}><span className="app-step-number">0{i+1}</span><h3>{step.title}</h3><p>{step.copy}</p></li>)}</ol>
      <details className="app-install-help"><summary><ShieldCheck size={18} aria-hidden="true"/> Android asking for permission?</summary><p>If Android asks, allow your browser to install this APK, then confirm installation. You can turn that browser permission off afterward. Download HomeTayo only from this official page.</p></details>
    </section>
    <div className="app-other-device"><span>On an iPhone, tablet or computer?</span><Link href="/sign-up">Create your account on the web <ExternalLink size={14} aria-hidden="true"/></Link></div>
  </div>;
}
