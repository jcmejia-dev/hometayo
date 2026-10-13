import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowLeft, CheckCircle2, HousePlus, MapPin, ShieldCheck } from "lucide-react";

export function AuthShell({mode,eyebrow,title,description,children}:{
 mode:"login"|"signup"|"other";eyebrow:string;title:string;description:string;children:ReactNode;
}){
 return <main className="auth-screen">
   <div className="container auth-layout">
     <section className="auth-editorial" aria-label="Why HomeTayo">
       <Link href="/" className="auth-back-link"><ArrowLeft size={17}/> Back to HomeTayo</Link>
       <span className="auth-brand-stamp"><span className="auth-stamp-mark"/> HOMETAYO</span>
       <h2>Find your next place.<br/><em>Feel right at home.</em></h2>
       <p>One place to discover rentals and manage property listings—with clear details and straightforward tools.</p>
       <div className="auth-editorial-points">
         <span><MapPin size={18}/> Explore rentals by location</span>
         <span><HousePlus size={18}/> List property details for review</span>
         <span><ShieldCheck size={18}/> Browse administrator-reviewed listings</span>
       </div>
       <span className="auth-editorial-foot">Hanap bahay. Dito tayo.</span>
     </section>
     <section className="auth-form-side" aria-labelledby="auth-title">
       <div className="auth-pane-top">
         <span className="auth-pane-kicker">{eyebrow}</span>
         <h1 id="auth-title">{title}</h1>
         <p>{description}</p>
       </div>
       {mode!=="other"&&<nav className="auth-mode-switch" aria-label="Authentication mode">
         <Link href="/sign-in" aria-current={mode==="login"?"page":undefined} className={mode==="login"?"active":""}>Sign in</Link>
         <Link href="/sign-up" aria-current={mode==="signup"?"page":undefined} className={mode==="signup"?"active":""}>Create account</Link>
       </nav>}
       {children}
       <div className="auth-privacy-line"><CheckCircle2 size={15}/><span>Your account role is managed by HomeTayo. No public admin registration.</span></div>
     </section>
   </div>
 </main>;
}
