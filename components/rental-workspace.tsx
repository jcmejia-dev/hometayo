"use client";
import { useCallback,useEffect,useRef,useState } from "react";
import { Bell,MessageCircle,Building2,Wallet,Send,Check } from "lucide-react";
import type { OperationsState } from "@/lib/rental-operation-types";
import type { RentalUnit } from "@/lib/rental-unit-input";
const pesos=(n:number|string)=>new Intl.NumberFormat("en-PH",{style:"currency",currency:"PHP"}).format(Number(n)/100);
const today=()=>new Intl.DateTimeFormat("en-CA",{timeZone:"Asia/Manila",year:"numeric",month:"2-digit",day:"2-digit"}).format(new Date());

export function RentalWorkspace({owner,initialConversation=""}:{owner:boolean;initialConversation?:string}){
 const [state,setState]=useState<OperationsState|null>(null),[selected,setSelected]=useState(initialConversation),[month,setMonth]=useState("");
 const [unitData,setUnitData]=useState<{listingId:string;units:RentalUnit[]}>({listingId:"",units:[]}),[notice,setNotice]=useState(""),[busy,setBusy]=useState(false),[panel,setPanel]=useState<"messages"|"notifications">("messages");
 const [loadedConversation,setLoadedConversation]=useState("");
 const [history,setHistory]=useState<{conversationId:string;before:string}>({conversationId:"",before:""});
 const messageList=useRef<HTMLDivElement>(null);
 const before=history.conversationId===selected?history.before:"";
 const request=useRef(0),events=useRef(new WeakMap<HTMLFormElement,{fingerprint:string;id:string}>());
 const load=useCallback(async()=>{
  const key=++request.current;
  const response=await fetch(`/api/rental-operations?${new URLSearchParams({...(selected?{conversationId:selected}:{}),...(month?{month}: {}),...(before?{before}: {})})}`,{cache:"no-store"});
  const data=await response.json();if(!response.ok)throw Error(data.message||"Could not refresh.");
  if(key===request.current){setState(data);setLoadedConversation(selected);setNotice("");}
 },[selected,month,before]);
 const invalidate=useCallback(()=>{request.current++;},[]);
 useEffect(()=>{void load().catch(e=>setNotice(e.message));const timer=setInterval(()=>{if(document.visibilityState==="visible")void load().catch(e=>setNotice(e.message));},15000);return()=>{clearInterval(timer);invalidate();};},[load,invalidate]);
 const conversation=state?.conversations.find(c=>c.id===selected);
 const units=unitData.listingId===conversation?.listingId?unitData.units:[];
 useEffect(()=>{if(!conversation?.isOwner)return;let live=true;
  fetch(`/api/owner-units?listingId=${conversation.listingId}`).then(r=>r.ok?r.json():Promise.reject(Error("Could not load units."))).then(v=>{if(live)setUnitData({listingId:conversation.listingId,units:v.units});}).catch(e=>{if(live)setNotice(e.message);});return()=>{live=false;};
 },[conversation?.listingId,conversation?.isOwner,state?.tenancies]);
 async function act(body:Record<string,unknown>){
  if(busy)return false;setBusy(true);setNotice("");
  try{const r=await fetch("/api/rental-operations",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(body)}),data=await r.json();if(!r.ok)throw Error(data.message);await load();setNotice(data.message);return true;}
  catch(e){setNotice(e instanceof Error?e.message:"Could not save.");return false;}finally{setBusy(false);}
 }
 async function submit(event:React.FormEvent<HTMLFormElement>,action:string,extra:Record<string,unknown>={}){
  event.preventDefault();const form=event.currentTarget;
  if((action==="end"||action==="void"||action==="voidCharge")&&!window.confirm(action==="end"?"Record move-out and make this unit available?":"Void this recorded payment? Its history will remain visible."))return;
  const data=Object.fromEntries(new FormData(form));
  const fingerprint=JSON.stringify({...data,...extra,action});
  if(events.current.get(form)?.fingerprint!==fingerprint)events.current.set(form,{fingerprint,id:crypto.randomUUID()});
  if(await act({...data,...extra,action,eventId:events.current.get(form)!.id})){events.current.delete(form);form.reset();}
 }
 const unread=state?.notifications.filter(n=>!n.readAt).length||0;
 const lastMessage=state?.messages.at(-1);
 useEffect(()=>{const element=messageList.current;if(element&&!before){const nearEnd=element.scrollHeight-element.scrollTop-element.clientHeight<120;if(nearEnd||lastMessage?.mine)element.scrollTo({top:element.scrollHeight,behavior:window.matchMedia("(prefers-reduced-motion: reduce)").matches?"instant":"smooth"});}},[lastMessage?.id,lastMessage?.mine,before]);
 return <div className="rental-workspace">
  {owner&&<section aria-label="Owner dashboard" className="workspace-overview">
   <div className="workspace-heading"><div><p className="section-kicker">PROPERTY OVERVIEW</p><h2>Your rentals, organized.</h2></div><label>Reporting month<input type="month" value={month||state?.month||""} onChange={e=>setMonth(e.target.value)}/></label></div>
   <div className="workspace-stats">{[["Properties",state?.summary.properties??"—"],["Available units",state?.summary.available??"—"],["Occupied units",state?.summary.occupied??"—"],["Rent charged this month",state?pesos(state.summary.expectedCentavos):"—"],["Payments recorded this month",state?pesos(state.summary.collectedCentavos):"—"],["Outstanding through today",state?pesos(state.summary.outstandingCentavos):"—"]].map(([label,value])=><div className="info-card" key={label}><span>{label}</span><strong>{value}</strong></div>)}</div>
   <p className="workspace-hint">Totals use recorded charges and non-voided payments. HomeTayo does not collect or verify transfers. Overpayments remain visible in each ledger.</p>
  </section>}
  <div className="workspace-tabs" role="tablist" aria-label="Rental workspace"><button role="tab" aria-selected={panel==="messages"} onClick={()=>setPanel("messages")}><MessageCircle size={18}/>Messages & tenancies</button><button role="tab" aria-selected={panel==="notifications"} onClick={()=>setPanel("notifications")}><Bell size={18}/>Notifications {unread>0&&<span className="workspace-badge">{unread}</span>}</button><button onClick={()=>void load().catch(e=>setNotice(e.message))}>Refresh</button></div>
  {!!notice&&<p role="status" className="status-notice">{notice}</p>}
  {!state&&!notice&&<p role="status">Loading your workspace…</p>}
  {panel==="notifications"?<section className="workspace-notifications">{!state?.notifications.length&&<div className="info-card"><Bell/><h2>You’re up to date</h2><p>New inquiries, messages, tenancy updates, and payment reminders appear here.</p></div>}{state?.notifications.map(n=><article className={`info-card ${!n.readAt?"notice-unread":""}`} key={n.id}><p>{n.body}</p><small>{new Date(n.createdAt).toLocaleString()}</small><div className="workspace-actions"><button className="button button-outline" onClick={()=>{setSelected(n.conversationId);setPanel("messages");}}>Open conversation</button>{!n.readAt&&<button disabled={busy} className="button button-outline" onClick={()=>void act({action:"read",notificationId:n.id})}><Check size={16}/>Mark read</button>}</div></article>)}</section>:<div className="workspace-columns">
   <aside className="workspace-threads" aria-label="Conversations">{!state?.conversations.length&&<div className="info-card"><MessageCircle/><h3>No conversations yet</h3><p>{owner?"Renters can send an inquiry from your published listing.":"Explore rentals and send an inquiry to an owner to get started."}</p></div>}{state?.conversations.map(c=><button className={`thread-button ${c.id===selected?"thread-selected":""}`} key={c.id} onClick={()=>setSelected(c.id)}><strong>{c.title}</strong><span>{c.otherName}</span></button>)}</aside>
   <section className="workspace-detail" key={selected}>{selected&&loadedConversation!==selected?<p role="status">Loading conversation…</p>:!conversation?<div className="info-card"><MessageCircle/><h2>Your rental conversations</h2><p>Select a conversation to read messages, review a tenancy, or check payment history.</p></div>:<>
    <div className="workspace-heading"><div><h2>{conversation.title}</h2><p>Conversation with {conversation.otherName}</p></div><a className="text-link" href={`/rentals/${conversation.slug}`}>View rental</a></div>
    <div className="workspace-actions">{state?.messages.length===100&&<button className="button button-outline" onClick={()=>setHistory({conversationId:selected,before:state.messages[0].id})}>Earlier messages</button>}{before&&<button className="button button-outline" onClick={()=>setHistory({conversationId:selected,before:""})}>Latest messages</button>}</div>
    <div ref={messageList} className="workspace-messages" aria-label="Conversation messages">{!state?.messages.length&&<p>{before?"No earlier messages.":"Start the conversation. Keep payment and tenancy discussions here so both people can refer back to them."}</p>}{state?.messages.map(m=><div className={`message-bubble ${m.mine?"message-mine":""}`} key={m.id}><p>{m.body}</p><small>{m.mine?"You":"Other participant"} · {new Date(m.createdAt).toLocaleString()}</small></div>)}</div>
    <form onSubmit={e=>void submit(e,"message",{conversationId:selected})} className="workspace-compose"><label className="sr-only" htmlFor="message-body">Message</label><textarea id="message-body" name="body" required maxLength={2000} placeholder="Write a message…"/><button disabled={busy} className="button button-primary"><Send size={18}/>Send</button></form>
    <section className="info-card"><h3><Building2 size={18}/> Tenancy & occupancy</h3>
     {state?.tenancies.map(t=><div key={t.id} className="workspace-tenancy"><strong>{t.label} · {t.status}</strong><p>{pesos(t.monthlyRentCentavos)} / month · starts {t.startsOn}{t.endedOn?` · ended ${t.endedOn}`:""}</p>
      {t.status==="invited"&&<div className="workspace-actions">{!conversation.isOwner&&<button disabled={busy} className="button button-primary" onClick={()=>{if(window.confirm("Accept this unit, monthly rent, and start date?"))void act({action:"accept",tenancyId:t.id});}}>Accept tenancy</button>}<button disabled={busy} className="button button-outline" onClick={()=>void act({action:"decline",tenancyId:t.id})}>{conversation.isOwner?"Cancel invitation":"Decline"}</button></div>}
      {conversation.isOwner&&t.status==="active"&&<><form className="workspace-form" onSubmit={e=>void submit(e,"charge",{tenancyId:t.id})}><h4>Add a rent charge</h4><label>Description<input name="description" required maxLength={120} placeholder="June rent"/></label><label>Due date<input name="dueOn" type="date" min={t.startsOn} required/></label><label>Amount (₱)<input name="amount" type="number" step="0.01" min="1" max="5000000" defaultValue={t.monthlyRentCentavos/100} required/></label><button disabled={busy} className="button button-primary">Add charge</button></form><form className="workspace-form" onSubmit={e=>void submit(e,"end",{tenancyId:t.id})}><label>Move-out date<input type="date" name="endedOn" required min={t.startsOn} max={today()}/></label><button className="button button-outline" disabled={busy}>Record move-out</button></form></>}
     </div>)}
     {conversation.isOwner&&!state?.tenancies.some(t=>["invited","active"].includes(t.status))&&<form className="workspace-form" onSubmit={e=>void submit(e,"invite",{conversationId:selected})}><h4>Invite renter to a unit</h4><p>The renter reviews and accepts before occupancy is confirmed.</p><label>Available unit<select name="unitId" required defaultValue=""><option value="" disabled>Choose a unit</option>{units.filter(u=>u.status==="available").map(u=><option key={u.id} value={u.id}>{u.label} · {pesos(u.monthlyRentCentavos)}</option>)}</select></label><label>Agreed rent (₱/month)<input name="monthlyRent" type="number" min="1" max="5000000" step="0.01" required/></label><label>Start date<input type="date" name="startsOn" required/></label><button disabled={busy||!units.some(u=>u.status==="available")} className="button button-primary">Send tenancy invitation</button><a className="text-link" href={`/owner/listings/${conversation.listingId}/units`}>Manage rooms & availability</a></form>}
     {!state?.tenancies.length&&!conversation.isOwner&&<p>The owner can invite you to an available unit after you agree on the details.</p>}
    </section>
    <section className="info-card"><h3><Wallet size={18}/> Rent ledger</h3><p>Payments are recorded by the owner. Contact them here if an entry needs correction.</p>{!state?.charges.length&&<p>No charges recorded yet.</p>}{state?.charges.map(r=>{const balance=r.amountCentavos-Number(r.paidCentavos);return <article className="workspace-charge" key={r.id}><h4>{r.description}{r.voidedAt?" · VOIDED":""}</h4>{r.voidReason&&<p>Correction: {r.voidReason}</p>}<p>Due {r.dueOn} · Charged {pesos(r.amountCentavos)} · Recorded {pesos(r.paidCentavos)}</p><strong>{r.voidedAt?"Charge voided":balance<0?`Overpayment ${pesos(-balance)}`:`Balance ${pesos(balance)}`}</strong>
     {state.payments.filter(p=>p.chargeId===r.id).map(p=><div key={p.id} className="workspace-payment"><p>{p.paidOn} · {pesos(p.amountCentavos)} {p.voidedAt?"· VOIDED":"· recorded"}</p><p>{p.note}{p.voidReason?` · Correction: ${p.voidReason}`:""}</p>{conversation.isOwner&&!p.voidedAt&&<form onSubmit={e=>void submit(e,"void",{paymentId:p.id})} className="workspace-inline"><input name="reason" required maxLength={250} placeholder="Reason for correction" aria-label="Reason for voiding payment"/><button disabled={busy} className="button button-outline">Void entry</button></form>}</div>)}
     {conversation.isOwner&&!r.voidedAt&&<><form className="workspace-form" onSubmit={e=>void submit(e,"payment",{chargeId:r.id})}><h4>Record full or partial payment</h4><label>Amount received (₱)<input name="amount" type="number" step="0.01" min="0.01" max="5000000" required/></label><label>Payment date<input name="paidOn" type="date" max={today()} required/></label><label>Note / reference<input name="note" maxLength={250}/></label><button disabled={busy} className="button button-primary">Record payment</button></form>{Number(r.paidCentavos)===0&&<form className="workspace-inline" onSubmit={e=>void submit(e,"voidCharge",{chargeId:r.id})}><input name="reason" required maxLength={250} placeholder="Reason for charge correction" aria-label="Reason for voiding charge"/><button disabled={busy} className="button button-outline">Void charge</button></form>}{balance>0&&<button disabled={busy} className="button button-outline" onClick={()=>void act({action:"remind",chargeId:r.id})}>Send payment reminder</button>}</>}
    </article>;})}</section>
   </>}</section>
  </div>}
 </div>;
}
