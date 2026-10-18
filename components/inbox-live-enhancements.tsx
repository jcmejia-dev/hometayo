"use client";

import {useEffect} from "react";

export function InboxLiveEnhancements({owner}:{owner:boolean}){
 useEffect(()=>{
  let refreshInFlight=false;
  let releaseTimer:number|undefined;
  const releaseRefresh=()=>{
   refreshInFlight=false;
   if(releaseTimer!==undefined){window.clearTimeout(releaseTimer);releaseTimer=undefined;}
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
    pill.textContent=otherRole==="owner"?"🏠 Owner":"👤 Renter";
   }
   if(refreshInFlight&&!document.querySelector(".workspace-detail .chat-welcome[role='status']"))releaseRefresh();
  };
  const refresh=()=>{
   if(document.visibilityState!=="visible"||refreshInFlight)return;
   if(document.querySelector(".workspace-detail .chat-welcome[role='status']"))return;
   const button=document.querySelector<HTMLButtonElement>(".chat-refresh");
   if(!button||button.disabled)return;
   refreshInFlight=true;
   button.click();
   releaseTimer=window.setTimeout(releaseRefresh,8000);
  };
  decorate();
  const observer=new MutationObserver(decorate);
  observer.observe(document.body,{childList:true,subtree:true});
  const timer=window.setInterval(refresh,2000);
  window.addEventListener("focus",refresh);
  document.addEventListener("visibilitychange",refresh);
  return()=>{observer.disconnect();window.clearInterval(timer);releaseRefresh();window.removeEventListener("focus",refresh);document.removeEventListener("visibilitychange",refresh);};
 },[owner]);
 return null;
}
