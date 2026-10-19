"use client";

import {useEffect} from "react";

export function InboxLiveEnhancements({owner}:{owner:boolean}){
 useEffect(()=>{
  let frame=0;

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
    if(!pill){
     pill=document.createElement("span");
     pill.className="chat-role-pill";
     heading.appendChild(pill);
    }
    const otherRole=owner?"renter":"owner";
    pill.dataset.role=otherRole;
    pill.textContent=otherRole==="owner"?"🏠 Owner":"👤 Renter";
   }
  };

  const scheduleDecorate=()=>{
   if(frame)return;
   frame=window.requestAnimationFrame(()=>{
    frame=0;
    decorate();
   });
  };

  decorate();

  const workspace=document.querySelector(".rental-workspace");
  if(!workspace)return()=>{};

  const observer=new MutationObserver(scheduleDecorate);
  observer.observe(workspace,{childList:true,subtree:true});

  return()=>{
   observer.disconnect();
   if(frame)window.cancelAnimationFrame(frame);
  };
 },[owner]);

 return null;
}
