"use client";

import {useEffect,useRef,useState} from "react";
import {ShieldAlert} from "lucide-react";

const MESSAGE="This action is prohibited.";

export function InteractionDeterrent(){
  const [visible,setVisible]=useState(false);
  const timer=useRef<ReturnType<typeof setTimeout>|null>(null);

  useEffect(()=>{
    const show=()=>{
      setVisible(true);
      if(timer.current)clearTimeout(timer.current);
      timer.current=setTimeout(()=>setVisible(false),2200);
    };

    const onContextMenu=(event:MouseEvent)=>{
      event.preventDefault();
      show();
    };

    const onKeyDown=(event:KeyboardEvent)=>{
      const key=event.key.toLowerCase();
      const modifier=event.ctrlKey||event.metaKey;
      const blocked=
        event.key==="F12"||
        (modifier&&event.shiftKey&&["i","j","c","k"].includes(key))||
        (modifier&&key==="u");

      if(!blocked)return;
      event.preventDefault();
      event.stopPropagation();
      show();
    };

    document.addEventListener("contextmenu",onContextMenu,{capture:true});
    window.addEventListener("keydown",onKeyDown,{capture:true});

    return()=>{
      document.removeEventListener("contextmenu",onContextMenu,{capture:true});
      window.removeEventListener("keydown",onKeyDown,{capture:true});
      if(timer.current)clearTimeout(timer.current);
    };
  },[]);

  return (
    <div
      role="status"
      aria-live="polite"
      aria-atomic="true"
      style={{
        position:"fixed",
        left:"50%",
        bottom:"max(24px, env(safe-area-inset-bottom))",
        zIndex:2147483647,
        display:"flex",
        alignItems:"center",
        gap:10,
        maxWidth:"calc(100vw - 32px)",
        padding:"12px 16px",
        border:"1px solid rgba(255,255,255,.16)",
        borderRadius:14,
        background:"rgba(16, 35, 29, .96)",
        color:"#fff",
        boxShadow:"0 14px 40px rgba(0,0,0,.24)",
        fontSize:14,
        fontWeight:700,
        letterSpacing:".01em",
        pointerEvents:"none",
        opacity:visible?1:0,
        transform:visible?"translate(-50%, 0)":"translate(-50%, 12px)",
        transition:"opacity 180ms ease, transform 180ms ease",
      }}
    >
      <ShieldAlert size={18} aria-hidden="true"/>
      <span>{MESSAGE}</span>
    </div>
  );
}
