"use client";

import {useCallback,useEffect,useMemo,useState} from "react";
import type {OperationsState} from "@/lib/rental-operation-types";
import type {RentalOffer,RentalOfferState} from "@/lib/rental-offer-types";
import styles from "./chat-rental-offer.module.css";

const pesos=(n:number|string)=>new Intl.NumberFormat("en-PH",{style:"currency",currency:"PHP"}).format(Number(n)/100);
const today=()=>new Intl.DateTimeFormat("en-CA",{timeZone:"Asia/Manila",year:"numeric",month:"2-digit",day:"2-digit"}).format(new Date());
type CounterDraft={monthlyRent:string;securityDeposit:string;reservationAmount:string;reservationHours:string;reservationCredit:"none"|"first_rent"|"deposit";leaseStartsOn:string;moveInOn:string;leaseEndsOn:string;note:string};
const emptyCounter:CounterDraft={monthlyRent:"",securityDeposit:"0",reservationAmount:"0",reservationHours:"48",reservationCredit:"none",leaseStartsOn:"",moveInOn:"",leaseEndsOn:"",note:""};

export function ChatRentalOffer({owner,conversationId}:{owner:boolean;conversationId:string}){
 const [ops,setOps]=useState<OperationsState|null>(null),[offerState,setOfferState]=useState<RentalOfferState>({available:true,offers:[]});
 const [open,setOpen]=useState(false),[busy,setBusy]=useState(false),[notice,setNotice]=useState(""),[countering,setCountering]=useState(false),[draft,setDraft]=useState<CounterDraft>(emptyCounter);
 const load=useCallback(async()=>{
  if(!conversationId)return;
  const [opRes,offerRes]=await Promise.all([
   fetch(`/api/rental-operations?conversationId=${encodeURIComponent(conversationId)}`,{cache:"no-store"}),
   fetch(`/api/rental-offers?conversationId=${encodeURIComponent(conversationId)}`,{cache:"no-store"}),
  ]);
  const opData=await opRes.json();if(!opRes.ok)throw Error(opData.message||"Could not load rental details.");setOps(opData);
  const offerData=await offerRes.json();setOfferState(offerRes.ok?offerData:{available:false,offers:[]});
 },[conversationId]);
 useEffect(()=>{setOpen(false);setCountering(false);setNotice("");void load().catch(e=>setNotice(e instanceof Error?e.message:"Could not load offers."));const timer=window.setInterval(()=>{if(document.visibilityState==="visible")void load().catch(()=>{});},5000);return()=>window.clearInterval(timer);},[load]);
 const offers=offerState.offers,active=offers.find(o=>o.status==="pending");
 useEffect(()=>{if(active&&!active.mine)setOpen(true);},[active?.id,active?.mine]);
 const units=ops?.availableUnits.filter(u=>u.availableSpots>0)||[];
 const committed=Boolean(ops?.tenancies.some(t=>["invited","reserved","active","ending"].includes(t.status))||ops?.reservations.some(r=>["awaiting_payment","proof_submitted","reserved"].includes(r.status))||ops?.requests.some(r=>r.status==="pending"));
 const latest=offers[0];
 const label=active?(active.mine?"Offer sent":"Offer needs response"):latest?.status==="accepted"?"Offer accepted":owner?"Offers":"Make offer";
 async function act(body:Record<string,unknown>){if(busy)return;setBusy(true);setNotice("");try{const response=await fetch("/api/rental-offers",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(body)}),data=await response.json();if(!response.ok)throw Error(data.message||"Could not update this offer.");setNotice(data.message||"Saved.");setCountering(false);await load();window.dispatchEvent(new Event("hometayo:notices-changed"));}catch(e){setNotice(e instanceof Error?e.message:"Could not update this offer.");}finally{setBusy(false);}}
 function openCounter(offer:RentalOffer){setDraft({monthlyRent:String(offer.monthlyRentCentavos/100),securityDeposit:String(offer.securityDepositCentavos/100),reservationAmount:String(offer.reservationAmountCentavos/100),reservationHours:String(offer.reservationHours),reservationCredit:offer.reservationCredit,leaseStartsOn:offer.leaseStartsOn,moveInOn:offer.moveInOn,leaseEndsOn:offer.leaseEndsOn||"",note:""});setCountering(true);setOpen(true);}
 return <section className={styles.dock} aria-label="Rental offer negotiation">
  <div className={styles.bar}><button type="button" className={styles.toggle} onClick={()=>setOpen(v=>!v)}><span aria-hidden="true">🏷️</span><span>Offer & negotiate</span><span className={styles.badge}>{label}</span></button>{active&&!active.mine&&<span className={styles.badge}>Your turn</span>}</div>
  {open&&<div className={styles.panel}>
   {!offerState.available?<p className={styles.unavailable}>Offer negotiation is not active in this HomeTayo environment yet.</p>:active?<ActiveOffer owner={owner} offer={active} busy={busy} countering={countering} draft={draft} setDraft={setDraft} act={act} openCounter={openCounter} cancelCounter={()=>setCountering(false)}/>:!owner&&!committed?<MakeOffer conversationId={conversationId} units={units} busy={busy} act={act}/>:<div><h4>{committed?"Rental terms already committed":"Waiting for renter offer"}</h4><p className={styles.muted}>{committed?"This rental has already moved into request, reservation, or tenancy.":"When the renter sends an offer, you can accept, counter, or decline it right here in chat."}</p></div>}
   {!!notice&&<p role="status" className={styles.notice}>{notice}</p>}
   {!!offers.length&&<details className={styles.history}><summary>Offer history ({offers.length})</summary>{offers.slice(0,6).map(o=><div key={o.id} className={styles.historyItem}><span><strong>{o.proposedByRole==="owner"?"Owner":"Renter"}</strong> · {pesos(o.monthlyRentCentavos)}/month · {o.unitLabel}</span><span className={styles.status}>{o.status}</span></div>)}</details>}
  </div>}
 </section>;
}

function ActiveOffer({owner,offer,busy,countering,draft,setDraft,act,openCounter,cancelCounter}:{owner:boolean;offer:RentalOffer;busy:boolean;countering:boolean;draft:CounterDraft;setDraft:(v:CounterDraft)=>void;act:(body:Record<string,unknown>)=>Promise<void>;openCounter:(offer:RentalOffer)=>void;cancelCounter:()=>void}){
 return <><div className={styles.top}><div><span className={styles.badge}>{offer.proposedByRole==="owner"?"Owner counteroffer":"Renter offer"}</span><h4>{offer.unitLabel} · asking {pesos(offer.askingRentCentavos)}/month</h4><p>{offer.mine?`Waiting for ${owner?"the renter":"the owner"}.`:"Review these terms before responding."}</p></div><div className={styles.price}>{pesos(offer.monthlyRentCentavos)} <small>/month</small></div></div>
 <div className={styles.terms}><Term label="Deposit" value={pesos(offer.securityDepositCentavos)}/><Term label="Reservation" value={offer.reservationAmountCentavos?pesos(offer.reservationAmountCentavos):"None"}/><Term label="Move-in" value={offer.moveInOn}/><Term label="Lease starts" value={offer.leaseStartsOn}/><Term label="Lease ends" value={offer.leaseEndsOn||"Open"}/><Term label="Pay window" value={`${offer.reservationHours} hours`}/></div>
 {offer.note&&<p className={styles.note}>“{offer.note}”</p>}
 {offer.mine?<div className={styles.waiting}><span>You can withdraw while the other person is deciding.</span><button type="button" disabled={busy} className={styles.secondary} onClick={()=>void act({action:"withdrawOffer",offerId:offer.id})}>Withdraw</button></div>:<div className={styles.actions}><button type="button" disabled={busy} className={styles.primary} onClick={()=>void act({action:"acceptOffer",offerId:offer.id})}>Accept</button><button type="button" disabled={busy} className={styles.secondary} onClick={()=>openCounter(offer)}>Counter</button><button type="button" disabled={busy} className={styles.danger} onClick={()=>{const reason=window.prompt("Optional reason for declining","")||"";void act({action:"declineOffer",offerId:offer.id,reason});}}>Decline</button></div>}
 {countering&&!offer.mine&&<CounterForm draft={draft} setDraft={setDraft} busy={busy} cancel={cancelCounter} submit={()=>void act({action:"counterOffer",offerId:offer.id,...draft,reservationHours:Number(draft.reservationHours)||48})}/>}</>;
}

function MakeOffer({conversationId,units,busy,act}:{conversationId:string;units:OperationsState["availableUnits"];busy:boolean;act:(body:Record<string,unknown>)=>Promise<void>}){
 const [unitId,setUnitId]=useState(""),[monthlyRent,setMonthlyRent]=useState(""),[moveInOn,setMoveInOn]=useState(""),[note,setNote]=useState("");
 const chosen=useMemo(()=>units.find(u=>u.id===unitId),[units,unitId]);
 return <div><div className={styles.top}><div><span className={styles.badge}>Renter offer</span><h4>Make an offer in this chat</h4><p>Propose your monthly rent and move-in date. Sending an offer does not reserve the room.</p></div>{chosen&&<div className={styles.price}>{pesos(chosen.monthlyRentCentavos)} <small>asking</small></div>}</div><div className={styles.form}><label>Room / unit<select value={unitId} onChange={e=>{setUnitId(e.target.value);const u=units.find(x=>x.id===e.target.value);if(u)setMonthlyRent(String(u.monthlyRentCentavos/100));}}><option value="">Choose a unit</option>{units.map(u=><option key={u.id} value={u.id}>{u.label} · asking {pesos(u.monthlyRentCentavos)}</option>)}</select></label><div className={styles.formGrid}><label>Your monthly offer (₱)<input type="number" min="1" step="0.01" value={monthlyRent} onChange={e=>setMonthlyRent(e.target.value)}/></label><label>Preferred move-in<input type="date" min={today()} value={moveInOn} onChange={e=>setMoveInOn(e.target.value)}/></label></div><label>Message to owner<textarea maxLength={500} value={note} onChange={e=>setNote(e.target.value)} placeholder="Optional note about your offer"/></label><div className={styles.actions}><button type="button" className={styles.primary} disabled={busy||!unitId||!monthlyRent||!moveInOn} onClick={()=>void act({action:"makeOffer",conversationId,unitId,monthlyRent,moveInOn,note})}>Send offer</button></div>{!units.length&&<p className={styles.muted}>No unit has an open spot right now.</p>}</div></div>;
}

function CounterForm({draft,setDraft,busy,cancel,submit}:{draft:CounterDraft;setDraft:(v:CounterDraft)=>void;busy:boolean;cancel:()=>void;submit:()=>void}){
 const set=(key:keyof CounterDraft,value:string)=>setDraft({...draft,[key]:value});
 return <div className={styles.form}><div className={styles.formGrid}><label>Monthly rent (₱)<input type="number" min="1" step="0.01" value={draft.monthlyRent} onChange={e=>set("monthlyRent",e.target.value)}/></label><label>Security deposit (₱)<input type="number" min="0" step="0.01" value={draft.securityDeposit} onChange={e=>set("securityDeposit",e.target.value)}/></label><label>Reservation payment (₱)<input type="number" min="0" step="0.01" value={draft.reservationAmount} onChange={e=>set("reservationAmount",e.target.value)}/></label><label>Payment window (hours)<input type="number" min="1" max="168" value={draft.reservationHours} onChange={e=>set("reservationHours",e.target.value)}/></label><label>Lease starts<input type="date" value={draft.leaseStartsOn} onChange={e=>set("leaseStartsOn",e.target.value)}/></label><label>Move-in<input type="date" value={draft.moveInOn} onChange={e=>set("moveInOn",e.target.value)}/></label><label>Lease ends (optional)<input type="date" value={draft.leaseEndsOn} onChange={e=>set("leaseEndsOn",e.target.value)}/></label><label>Reservation credit<select value={draft.reservationCredit} onChange={e=>setDraft({...draft,reservationCredit:e.target.value as CounterDraft["reservationCredit"]})}><option value="none">Separate fee</option><option value="first_rent">First rent</option><option value="deposit">Deposit</option></select></label></div><label>Counteroffer note<textarea maxLength={500} value={draft.note} onChange={e=>set("note",e.target.value)}/></label><div className={styles.actions}><button type="button" className={styles.primary} disabled={busy||!draft.monthlyRent||!draft.leaseStartsOn||!draft.moveInOn} onClick={submit}>Send counteroffer</button><button type="button" className={styles.secondary} disabled={busy} onClick={cancel}>Cancel</button></div></div>;
}

function Term({label,value}:{label:string;value:string}){return <div className={styles.term}><span>{label}</span><strong>{value}</strong></div>}
