"use client";

import Link from "next/link";
import {useCallback,useEffect,useRef,useState} from "react";
import {Bell,Check,MessageCircle,ArrowUpRight,X,Volume2,VolumeX} from "lucide-react";
import {useNotificationSound} from "@/components/use-notification-sound";
import type {Conversation,Notice} from "@/lib/rental-operation-types";

type OpenPanel="messages"|"notifications"|null;

export function HeaderInboxActions() {
  const sound=useNotificationSound();
  const onNotifications=sound.onNotifications;
  const [open,setOpen]=useState<OpenPanel>(null),[notices,setNotices]=useState<Notice[]>([]),[conversations,setConversations]=useState<Conversation[]>([]),[error,setError]=useState(""),[loading,setLoading]=useState(true),[saving,setSaving]=useState("");
  const root=useRef<HTMLDivElement>(null),messageButton=useRef<HTMLButtonElement>(null),notificationButton=useRef<HTMLButtonElement>(null);
  const load=useCallback(async(signal?:AbortSignal)=>{
    try {
      const response=await fetch("/api/notifications",{cache:"no-store",signal:signal?AbortSignal.any([signal,AbortSignal.timeout(10000)]):AbortSignal.timeout(10000)}),data=await response.json();
      if(!response.ok)throw Error("Notifications couldn’t load. Please try again.");
      if(!signal?.aborted){onNotifications(data.notifications);setNotices(data.notifications);setConversations(data.conversations||[]);setError("");}
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
    function outside(event:PointerEvent){if(!root.current?.contains(event.target as Node))setOpen(null);}
    function escape(event:KeyboardEvent){if(event.key==="Escape"){const current=open;setOpen(null);(current==="messages"?messageButton:notificationButton).current?.focus();}}
    document.addEventListener("pointerdown",outside);document.addEventListener("keydown",escape);
    return()=>{document.removeEventListener("pointerdown",outside);document.removeEventListener("keydown",escape);};
  },[open]);

  const messageNotices=notices.filter(n=>n.kind==="message");
  const rentalNotices=notices.filter(n=>n.kind!=="message");
  const messageUnread=messageNotices.filter(n=>!n.readAt).length;
  const rentalUnread=rentalNotices.filter(n=>!n.readAt).length;
  const otherName=(conversationId:string|null)=>conversationId?conversations.find(c=>c.id===conversationId)?.otherName||"Someone":"Someone";
  const noticeBody=(n:Notice)=>n.kind==="message"?`${otherName(n.conversationId)} sent you a message`:n.kind==="inquiry"?`New rental inquiry from ${otherName(n.conversationId)}`:n.body;

  async function read(id:string){
    if(saving)return;setSaving(id);
    try{
      const response=await fetch("/api/rental-operations",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({action:"read",notificationId:id})});
      if(!response.ok)throw Error("Couldn’t mark this notification as read.");
      await load();window.dispatchEvent(new Event("hometayo:notices-changed"));
    }catch(e){setError(e instanceof Error?e.message:"Please try again.");}finally{setSaving("");}
  }
  function openPanel(panel:Exclude<OpenPanel,null>){setOpen(current=>current===panel?null:panel);void load();}
  function item(n:Notice){const href=n.conversationId?`/inbox?conversationId=${encodeURIComponent(n.conversationId)}`:"/owner";return <article key={n.id} className={`notification-item ${!n.readAt?"is-unread":""}`}><span className="notification-dot" aria-label={n.readAt?"Read":"Unread"}/><div><Link onClick={()=>{setOpen(null);if(!n.readAt)void read(n.id);}} href={href}><p>{noticeBody(n)}</p><time dateTime={n.createdAt}>{new Date(n.createdAt).toLocaleString("en-PH",{month:"short",day:"numeric",hour:"numeric",minute:"2-digit"})}</time></Link>{!n.readAt&&<button className="notification-read" disabled={!!saving} onClick={()=>void read(n.id)}><Check size={14}/>{saving===n.id?"Saving…":"Mark read"}</button>}</div></article>}

  return <div className="header-inbox-actions" ref={root}>
    <button ref={messageButton} type="button" className={`header-icon-button ${open==="messages"?"is-open":""}`} aria-label={`Messages${messageUnread?`, ${messageUnread} unread`:""}`} aria-expanded={open==="messages"} aria-controls="header-messages" onClick={()=>openPanel("messages")} title={messageUnread?`${messageUnread} unread message${messageUnread===1?"":"s"}`:"Messages"}><MessageCircle size={21}/>{messageUnread>0&&<span className="header-notification-count" aria-hidden="true">{messageUnread>99?"99+":messageUnread}</span>}</button>
    <button ref={notificationButton} type="button" className={`header-icon-button ${open==="notifications"?"is-open":""}`} aria-label={`Notifications${rentalUnread?`, ${rentalUnread} unread`:""}`} aria-expanded={open==="notifications"} aria-controls="header-notifications" onClick={()=>openPanel("notifications")} title="Notifications"><Bell size={21}/>{rentalUnread>0&&<span className="header-notification-count" aria-hidden="true">{rentalUnread>99?"99+":rentalUnread}</span>}</button>

    {open==="messages"&&<section id="header-messages" className="notification-popover" aria-label="Messages">
      <div className="notification-heading"><div><h2>Messages</h2><p>{messageUnread?`${messageUnread} unread message${messageUnread===1?"":"s"}`:"Your conversations are up to date"}</p></div><button className="header-icon-button" aria-label="Close messages" onClick={()=>{setOpen(null);messageButton.current?.focus();}}><X size={18}/></button></div>
      {error&&<div className="notification-error" role="status">{error}<button className="text-link" onClick={()=>void load()}>Try again</button></div>}
      {loading?<p className="notification-empty" role="status">Loading messages…</p>:!error&&!messageNotices.length?<div className="notification-empty"><span className="notification-empty-icon"><MessageCircle size={26}/></span><h3>No new messages</h3><p>When an owner or renter chats with you, their name will appear here.</p></div>:<div className="notification-items">{messageNotices.map(item)}</div>}
      <Link className="notification-footer" href="/inbox" onClick={()=>setOpen(null)}>Open all messages<ArrowUpRight size={16}/></Link>
    </section>}

    {open==="notifications"&&<section id="header-notifications" className="notification-popover" aria-label="Notifications">
      <div className="notification-heading"><div><h2>Notifications</h2><p>{rentalUnread?`${rentalUnread} unread update${rentalUnread===1?"":"s"}`:"Your rental updates, all here"}</p></div><button className="header-icon-button" aria-label="Close notifications" onClick={()=>{setOpen(null);notificationButton.current?.focus();}}><X size={18}/></button></div>
      <button type="button" className="notification-sound-toggle" onClick={sound.toggle} aria-pressed={sound.enabled}>{sound.enabled?<Volume2 size={16}/>:<VolumeX size={16}/>}Notification sound {sound.enabled?"on":"off"}</button>
      {error&&<div className="notification-error" role="status">{error}<button className="text-link" onClick={()=>void load()}>Try again</button></div>}
      {loading?<p className="notification-empty" role="status">Loading updates…</p>:!error&&!rentalNotices.length?<div className="notification-empty"><span className="notification-empty-icon"><Bell size={26}/></span><h3>You’re all caught up</h3><p>Reactions, inquiries, tenancy changes and payment updates will appear here.</p></div>:<div className="notification-items">{rentalNotices.map(item)}</div>}
      <Link className="notification-footer" href="/inbox" onClick={()=>setOpen(null)}>Open rental workspace<ArrowUpRight size={16}/></Link>
    </section>}
  </div>;
}
