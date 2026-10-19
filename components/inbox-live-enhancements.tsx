"use client";

import {useEffect} from "react";

type TypingState={typing?:boolean};

export function InboxLiveEnhancements({owner}:{owner:boolean}){
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
   const field=document.querySelector<HTMLTextAreaElement>("#message-body");field?.removeEventListener("input",signalTyping);
   if(frame)window.cancelAnimationFrame(frame);
  };
 },[owner]);

 return null;
}
