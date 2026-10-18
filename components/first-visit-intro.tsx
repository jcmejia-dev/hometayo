"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Building2, Compass, Home, MapPin, ShieldCheck, X } from "lucide-react";

export const INTRO_STORAGE_KEY = "hometayo.intro.v1";
const slides = [
  { title:"Find your next home", copy:"Explore houses, apartments, boarding houses and bedspaces that fit your needs.", Icon:Home, tag:"DISCOVER" },
  { title:"Search on your terms", copy:"Choose a location, set your budget and find properties published by property owners.", Icon:Compass, tag:"EXPLORE" },
  { title:"Have a place to rent?", copy:"Publish accurate rental details and manage availability from your owner dashboard.", Icon:Building2, tag:"LIST YOUR SPACE" },
];

/** First visit is optional. Skipping or browsing as guest never requires account creation. */
export function FirstVisitIntro({ forceOpen = false }: { forceOpen?: boolean }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [step,setStep] = useState(0);
  useEffect(()=>{
    let complete = false;
    try { complete = window.localStorage.getItem(INTRO_STORAGE_KEY) === "done"; }
    catch { /* Browser storage may be disabled; guest access must still work. */ }
    if ((forceOpen || !complete) && dialog.current && !dialog.current.open) {
      setStep(0);
      dialog.current.showModal();
    }
  },[forceOpen]);
  function close() {
    try {window.localStorage.setItem(INTRO_STORAGE_KEY,"done");} catch {}
    dialog.current?.close();
  }
  const slide = slides[Math.min(step,2)];
  const Icon = slide.Icon;
  return <dialog ref={dialog} className="intro-dialog" aria-label="Welcome to HomeTayo" onCancel={close}>
    <div className="intro-shell">
      <div className="intro-toolbar">
        <span className="intro-logo"><span className="intro-mark" aria-hidden="true"/> Home<span>Tayo</span></span>
        <button aria-label="Skip introduction" className="intro-skip" onClick={close}>Skip <X size={17}/></button>
      </div>
      {step < 3 ? <>
        <div className="intro-art" aria-hidden="true"><Icon size={62} strokeWidth={1.6}/><span className="intro-art-pin"><MapPin size={24}/></span></div>
        <span className="intro-kicker">{slide.tag} · {step+1} OF 3</span>
        <h2>{slide.title}</h2><p className="intro-description">{slide.copy}</p>
        <div className="intro-progress" aria-label={"Step "+(step+1)+" of 3"}>{slides.map((_,i)=><span key={i} className={i===step?"active":""}/>)}</div>
        <div className="intro-actions">
          {step > 0 && <button className="intro-back" onClick={()=>setStep(step-1)}><ArrowLeft size={17}/> Back</button>}
          <button className="intro-primary" onClick={()=>setStep(step+1)}>{step===2?"Get started":"Next"} <ArrowRight size={17}/></button>
        </div>
      </> : <>
        <div className="intro-welcome-icon"><ShieldCheck size={43}/></div>
        <span className="intro-kicker">WELCOME TO HOMETAYO</span>
        <h2>Your next chapter starts here.</h2>
        <p className="intro-description">Discover rentals without signing in. Create an account when you want to manage your own property.</p>
        <div className="intro-welcome-actions">
          <Link href="/sign-up" onClick={close} className="intro-primary">Create account <ArrowRight size={17}/></Link>
          <Link href="/sign-in" onClick={close} className="intro-secondary">Sign in</Link>
          <button onClick={close} className="intro-guest">Explore as guest <ArrowRight size={16}/></button>
        </div>
      </>}
    </div>
  </dialog>;
}
