"use client";
import {useCallback,useEffect,useMemo,useState} from "react";
import type {OperationsState} from "@/lib/rental-operation-types";
import type {RentalOffer,RentalOfferState} from "@/lib/rental-offer-types";
import styles from "./chat-rental-timeline.module.css";

const pesos=(n:number)=>new Intl.NumberFormat("en-PH",{style:"currency",currency:"PHP",maximumFractionDigits:0}).format(n/100);
type Event={id:string;at:string;kind:string;title:string;body:string;terms?:string[]};
export function ChatRentalTimeline({conversationId}:{conversationId:string}){
 const [offers,setOffers]=useState<RentalOffer[]>([]),[ops,setOps]=useState<OperationsState|null>(null);
 const load=useCallback(async()=>{const [a,b]=await Promise.all([fetch(`/api/rental-offers?conversationId=${encodeURIComponent(conversationId)}`,{cache:"no-store"}),fetch(`/api/rental-operations?conversationId=${encodeURIComponent(conversationId)}`,{cache:"no-store"})]);if(a.ok){const x=await a.json() as RentalOfferState;setOffers(x.offers||[]);}if(b.ok)setOps(await b.json() as OperationsState);},[conversationId]);
 useEffect(()=>{void load();const timer=window.setInterval(()=>{if(document.visibilityState==="visible")void load();},6000);return()=>window.clearInterval(timer);},[load]);
 const events=useMemo(()=>{
  const out:Event[]=[];
  for(const o of offers){
   const actor=o.proposedByRole==="owner"?"Owner":"Renter";
   out.push({id:`proposal:${o.id}`,at:o.createdAt,kind:"offer",title:o.parentOfferId?`${actor} sent a counteroffer`:`${actor} made an offer`,body:`${o.unitLabel} · ${pesos(o.monthlyRentCentavos)}/month`,terms:[`Move-in ${o.moveInOn}`,o.securityDepositCentavos?`Deposit ${pesos(o.securityDepositCentavos)}`:"No deposit",o.reservationAmountCentavos?`Reservation ${pesos(o.reservationAmountCentavos)}`:"No reservation fee"]});
   if(o.status!=="pending"&&o.respondedAt){const title=o.status==="accepted"?"Offer accepted — terms locked":o.status==="declined"?"Offer declined":o.status==="withdrawn"?"Offer withdrawn":"Previous offer countered";out.push({id:`resolution:${o.id}:${o.status}`,at:o.acceptedAt||o.respondedAt,kind:"offer",title,body:o.status==="accepted"?"HomeTayo moved the agreed terms into the reservation flow.":`${actor}'s offer is no longer pending.`});}
  }
  for(const n of ops?.notifications||[]){if(n.conversationId!==conversationId||["message","offer"].includes(n.kind))continue;out.push({id:`notice:${n.id}`,at:n.createdAt,kind:n.kind,title:({reservation:"Reservation update",payment_proof:"Payment verification",payment:"Payment update",reminder:"Rent reminder",tenancy:"Tenancy update",maintenance:"Maintenance update",document:"Document update",review:"Review update"} as Record<string,string>)[n.kind]||"Rental update",body:n.body});}
  return out.sort((x,y)=>new Date(x.at).getTime()-new Date(y.at).getTime()).slice(-14);
 },[offers,ops,conversationId]);
 if(!events.length)return null;
 return <div className={styles.timeline} aria-label="Rental transaction timeline">{events.map(e=><article className={styles.card} data-kind={e.kind} key={e.id}><div className={styles.head}><strong>HomeTayo · {e.title}</strong><time className={styles.time} dateTime={e.at}>{new Date(e.at).toLocaleString("en-PH",{month:"short",day:"numeric",hour:"numeric",minute:"2-digit"})}</time></div><div className={styles.body}>{e.body}</div>{e.terms&&<div className={styles.terms}>{e.terms.map(x=><span key={x} className={styles.pill}>{x}</span>)}</div>}</article>)}</div>;
}
