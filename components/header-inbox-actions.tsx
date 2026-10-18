"use client";

import Link from "next/link";
import {useCallback,useEffect,useRef,useState} from "react";
import {Bell,Check,MessageCircle,ArrowUpRight,X,Volume2,VolumeX} from "lucide-react";
import {useNotificationSound} from "@/components/use-notification-sound";
import type {Notice} from "@/lib/rental-operation-types";

export function HeaderInboxActions() {
  const sound=useNotificationSound();
  const onNotifications=sound.onNotifications;
  const [open,setOpen]=useState(false),[notices,setNotices]=useState<Notice[]>([]),[error,setError]=useState(""),[loading,setLoading]=useState(true),[saving,setSaving]=useState("");
  const root=useRef<HTMLDivElement>(null),button=useRef<HTMLButtonElement>(null);
  const load=useCallback(async(signal?:AbortSignal)=>{
    try {
      const response=await fetch("/api/notifications",{cache:"no-store",signal:signal?AbortSignal.any([signal,AbortSignal.timeout(10000)]):AbortSignal.timeout(10000)}),data=await response.json();
      if(!response.ok)throw Error("Notifications couldn’t load. Please try again.");
      if(!signal?.aborted){onNotifications(data.notifications);setNotices(data.notifications);setError("");}
    } catch(e){if(!signal?.aborted)setError(e instanceof Error?e.message:"Notifications couldn’t load.");}
    finally{if(!signal?.aborted)setLoading(false);}
  },[onNotifications]);
  useEffect(()=>{
    const controller=new AbortController();const initial=setTimeout(()=>void load(controller.signal),0);
    const refresh=()=>{if(document.visibilityState==="visible")void load(controller.signal);};
    const timer=setInterval(refresh,15000);
    document.addEventListener("visibilitychange",refresh);
    window.addEventListener("hometayo:notices-changed",refresh);
    return()=>{controller.abort();clearTimeout(initial);clearInterval(timer);document.removeEventListener("visibilitychange",refresh);window.removeEventListener("hometayo:notices-changed",refresh);};
  },[load]);
  useEffect(()=>{
    if(!open)return;
    function outside(event:PointerEvent){if(!root.current?.contains(event.target as Node))setOpen(false);}
    function escape(event:KeyboardEvent){if(event.key==="Escape"){setOpen(false);button.current?.focus();}}
    document.addEventListener("pointerdown",outside);document.addEventListener("keydown",escape);
    return()=>{document.removeEventListener("pointerdown",outside);document.removeEventListener("keydown",escape);};
  },[open]);
  const unread=notices.filter(n=>!n.readAt).length;
  async function read(id:string){
    if(saving)return;setSaving(id);
    try{
      const response=await fetch("/api/rental-operations",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({action:"read",notificationId:id})});
      if(!response.ok)throw Error("Couldn’t mark this notification as read.");
      await load();window.dispatchEvent(new Event("hometayo:notices-changed"));
    }catch(e){setError(e instanceof Error?e.message:"Please try again.");}finally{setSaving("");}
  }
  return <div className="header-inbox-actions" ref={root}>
    <Link className="header-icon-button" href="/inbox" onClick={()=>setOpen(false)} aria-label="Messages" title="Messages"><MessageCircle size={21}/></Link>
    <button ref={button} type="button" className={`header-icon-button ${open?"is-open":""}`} aria-label={`Notifications${unread?`, ${unread} unread`:""}`} aria-expanded={open} aria-controls="header-notifications" onClick={()=>{setOpen(!open);if(!open)void load();}} title="Notifications"><Bell size={21}/>{unread>0&&<span className="header-notification-count" aria-hidden="true">{unread>99?"99+":unread}</span>}</button>
    {open&&<section id="header-notifications" className="notification-popover" aria-label="Notifications">
      <div className="notification-heading"><div><h2>Notifications</h2><p>{unread?`${unread} unread update${unread===1?"":"s"}`:"Your rental updates, all here"}</p></div><button className="header-icon-button" aria-label="Close notifications" onClick={()=>{setOpen(false);button.current?.focus();}}><X size={18}/></button></div>
      <button type="button" className="notification-sound-toggle" onClick={sound.toggle} aria-pressed={sound.enabled}>{sound.enabled?<Volume2 size={16}/>:<VolumeX size={16}/>}Notification sound {sound.enabled?"on":"off"}</button>
      {error&&<div className="notification-error" role="status">{error}<button className="text-link" onClick={()=>void load()}>Try again</button></div>}
      {loading?<p className="notification-empty" role="status">Loading updates…</p>:!error&&!notices.length?<div className="notification-empty"><span className="notification-empty-icon"><Bell size={26}/></span><h3>You’re all caught up</h3><p>New messages, rental inquiries and payment reminders will appear here.</p></div>:<div className="notification-items">{notices.map(n=><article key={n.id} className={`notification-item ${!n.readAt?"is-unread":""}`}><span className="notification-dot" aria-label={n.readAt?"Read":"Unread"}/><div><Link onClick={()=>setOpen(false)} href={`/inbox?conversationId=${encodeURIComponent(n.conversationId)}`}><p>{n.body}</p><time dateTime={n.createdAt}>{new Date(n.createdAt).toLocaleString("en-PH",{month:"short",day:"numeric",hour:"numeric",minute:"2-digit"})}</time></Link>{!n.readAt&&<button className="notification-read" disabled={!!saving} onClick={()=>void read(n.id)}><Check size={14}/>{saving===n.id?"Saving…":"Mark read"}</button>}</div></article>)}</div>}
      <Link className="notification-footer" href="/inbox" onClick={()=>setOpen(false)}>Open messages<ArrowUpRight size={16}/></Link>
    </section>}
  </div>;
}
