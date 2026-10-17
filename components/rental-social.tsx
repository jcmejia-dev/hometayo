"use client";
import { useEffect,useState } from "react";
import { Heart,ThumbsUp,MessageCircle,Star } from "lucide-react";
import {useRouter} from "next/navigation";
export function RentalSocial({slug,canInquire=true}:{slug:string;canInquire?:boolean}){
 const router=useRouter();
 const [counts,setCounts]=useState<Array<{kind:string;count:number}>>([]),[mine,setMine]=useState<string|null>(null),[message,setMessage]=useState(""),[busy,setBusy]=useState(false);
 async function load(){const r=await fetch(`/api/reactions?slug=${encodeURIComponent(slug)}`);if(r.ok){const d=await r.json();setCounts(d.counts);setMine(d.mine);}}
 useEffect(()=>{let live=true;fetch(`/api/reactions?slug=${encodeURIComponent(slug)}`).then(r=>r.ok?r.json():null).then(d=>{if(live&&d){setCounts(d.counts);setMine(d.mine);}}).catch(()=>{});return()=>{live=false;};},[slug]);
 async function act(action:string,kind?:string){setBusy(true);setMessage("");try{const r=await fetch("/api/rental-operations",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({action,slug,kind})}),d=await r.json();if(r.status===401){router.push("/sign-in");return;}if(!r.ok)throw Error(d.message);if(action==="inquire"&&d.id){router.push(`/inbox?conversationId=${d.id}`);}else await load();}catch(e){setMessage(e instanceof Error?e.message:"Please try again.");}finally{setBusy(false);}}
 return <div className="rental-social"><div className="workspace-actions">{[["like","Like",ThumbsUp],["love","Love",Heart],["interested","Interested",Star]].map(([kind,label,Icon])=>{const Component=Icon as typeof Heart;return <button className="button button-outline" key={kind as string} disabled={busy} aria-pressed={mine===kind} onClick={()=>void act("react",mine===kind?"none":kind as string)}><Component size={17}/>{label as string} {counts.find(c=>c.kind===kind)?.count||0}</button>;})}{canInquire&&<button disabled={busy} className="button button-primary" onClick={()=>void act("inquire")}><MessageCircle size={17}/>Message owner</button>}</div>{message&&<p role="status">{message}</p>}</div>;
}
