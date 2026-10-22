"use client";

import {useEffect,useState} from "react";
import {createPortal} from "react-dom";
import {ChatRentalOffer} from "@/components/chat-rental-offer";

type TypingState={typing?:boolean};

export function InboxLiveEnhancements({owner}:{owner:boolean}){
 const [offerTarget,setOfferTarget]=useState<HTMLElement|null>(null);
 const [offerConversation,setOfferConversation]=useState("");
 useEffect(()=>{
  let frame=0,lastTypingSent=0,lastConversation="",polling=false;

  const conversationId=()=>document.querySelector<HTMLElement>(".chat-conversation-heading .report-control[data-conversation-id]")?.dataset.conversationId||"";

  const removeTypingBubble=()=>document.querySelector(".web-typing-bubble")?.remove();
  const showTypingBubble=()=>{
   const list=document.querySelector<HTMLElement>(".workspace-messages");
   if(!list)return;
   let bubble=list.querySelector<HTMLElement>(".web-typing-bubble");
   if(bubble)return;
   bubble=document.createElement("div");
   bubble.className="web-typing-bubble";
   Object.assign(bubble.style,{width:"58px",height:"38px",borderRadius:"19px 19px 19px 7px",background:"#eceef0",display:"flex",alignItems:"center",justifyContent:"center",gap:"5px",margin:"4px 0 8px 8px"});
   for(let i=0;i<3;i++){
    const dot=document.createElement("span");
    Object.assign(dot.style,{width:"8px",height:"8px",borderRadius:"50%",background:"#979aa1",display:"block"});
    bubble.appendChild(dot);
    dot.animate([{opacity:.35,transform:"translateY(0)"},{opacity:1,transform:"translateY(-3px)"},{opacity:.35,transform:"translateY(0)"}],{duration:780,iterations:Infinity,delay:i*130});
   }
   list.appendChild(bubble);
   list.scrollTo({top:list.scrollHeight,behavior:"smooth"});
  };

  const pollTyping=async()=>{
   if(polling||document.visibilityState!=="visible")return;
   const id=conversationId();
   if(!id){removeTypingBubble();lastConversation="";return;}
   if(id!==lastConversation){removeTypingBubble();lastConversation=id;}
   polling=true;
   try{
    const response=await fetch(`/api/rental-operations?${new URLSearchParams({conversationId:id})}`,{cache:"no-store"});
    if(!response.ok)return;
    const data=await response.json() as TypingState;
    if(data.typing)showTypingBubble();else removeTypingBubble();
   }catch{/* keep inbox usable if live presence is unavailable */}
   finally{polling=false;}
  };

  const signalTyping=()=>{
   const id=conversationId(),field=document.querySelector<HTMLTextAreaElement>("#message-body");
   if(!id||!field?.value.trim())return;
   const now=Date.now();if(now-lastTypingSent<1800)return;lastTypingSent=now;
   void fetch("/api/rental-operations",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({action:"typing",conversationId:id})}).catch(()=>{});
  };

  const surfacePendingTenancyInvite=()=>{
   const existing=document.querySelector<HTMLElement>(".tenancy-invite-alert");
   if(owner){existing?.remove();return;}
   const panels=Array.from(document.querySelectorAll<HTMLDetailsElement>(".chat-tool-panel"));
   const tenancyPanel=panels.find(panel=>panel.querySelector("summary")?.textContent?.includes("Tenancy & occupancy"));
   const invited=tenancyPanel?Array.from(tenancyPanel.querySelectorAll<HTMLElement>(".workspace-tenancy strong")).some(node=>/\binvited\b/i.test(node.textContent||"")):false;
   if(!tenancyPanel||!invited){existing?.remove();return;}
   tenancyPanel.open=true;
   if(existing)return;
   const heading=document.querySelector<HTMLElement>(".chat-conversation-heading");
   if(!heading)return;
   const alert=document.createElement("button");
   alert.type="button";
   alert.className="tenancy-invite-alert";
   alert.textContent="🏠 Rental invitation waiting — Review invitation";
   Object.assign(alert.style,{width:"calc(100% - 28px)",margin:"10px 14px 0",padding:"12px 14px",border:"1px solid #c8d8cd",borderRadius:"12px",background:"#eef7f0",color:"#143b2b",fontWeight:"700",textAlign:"left",cursor:"pointer"});
   alert.addEventListener("click",()=>{tenancyPanel.open=true;tenancyPanel.scrollIntoView({behavior:"smooth",block:"nearest"});const accept=Array.from(tenancyPanel.querySelectorAll<HTMLButtonElement>("button")).find(button=>button.textContent?.includes("Accept tenancy"));accept?.focus();});
   heading.insertAdjacentElement("afterend",alert);
  };

  const ensureOfferDock=()=>{
   const id=conversationId(),composer=document.querySelector<HTMLElement>(".composer-shell");
   if(!id||!composer){setOfferConversation(current=>current?"":current);setOfferTarget(current=>current?null:current);document.querySelector("#chat-rental-offer-root")?.remove();return;}
   let root=document.querySelector<HTMLElement>("#chat-rental-offer-root");
   if(!root||!root.isConnected){root=document.createElement("div");root.id="chat-rental-offer-root";composer.insertAdjacentElement("beforebegin",root);}
   setOfferConversation(current=>current===id?current:id);
   setOfferTarget(current=>current===root?current:root);
  };

  const decorate=()=>{
   document.querySelectorAll<HTMLElement>(".message-bubble").forEach((bubble)=>{
    const mine=bubble.classList.contains("message-mine");
    const role=mine?(owner?"owner":"renter"):(owner?"renter":"owner");
    bubble.classList.toggle("message-owner",role==="owner");
    bubble.classList.toggle("message-renter",role==="renter");
    bubble.dataset.role=role;
   });

   const heading=document.querySelector<HTMLElement>(".chat-conversation-heading > div:not(.chat-heading-actions)");
   if(heading){
    let pill=heading.querySelector<HTMLElement>(".chat-role-pill");
    if(!pill){pill=document.createElement("span");pill.className="chat-role-pill";heading.appendChild(pill);}
    const otherRole=owner?"renter":"owner";
    pill.dataset.role=otherRole;
    pill.textContent=otherRole==="owner"?"✓ Verified owner":"👤 Renter";
   }

   const field=document.querySelector<HTMLTextAreaElement>("#message-body");
   if(field&&!field.dataset.typingBound){field.dataset.typingBound="1";field.addEventListener("input",signalTyping);}
   surfacePendingTenancyInvite();
   ensureOfferDock();
  };

  const scheduleDecorate=()=>{
   if(frame)return;
   frame=window.requestAnimationFrame(()=>{frame=0;decorate();void pollTyping();});
  };

  decorate();void pollTyping();
  const workspace=document.querySelector(".rental-workspace");
  const observer=workspace?new MutationObserver(scheduleDecorate):null;
  observer?.observe(workspace!,{childList:true,subtree:true});
  const timer=window.setInterval(()=>void pollTyping(),1500);

  return()=>{
   observer?.disconnect();window.clearInterval(timer);removeTypingBubble();
   document.querySelector(".tenancy-invite-alert")?.remove();
   document.querySelector("#chat-rental-offer-root")?.remove();
   const field=document.querySelector<HTMLTextAreaElement>("#message-body");field?.removeEventListener("input",signalTyping);
   if(frame)window.cancelAnimationFrame(frame);
  };
 },[owner]);

 return offerTarget&&offerConversation?createPortal(<ChatRentalOffer owner={owner} conversationId={offerConversation}/>,offerTarget):null;
}