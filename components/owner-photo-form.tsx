"use client";
import {useState} from "react";
export function OwnerPhotoForm({listingId}:{listingId:string}){
 const [message,setMessage]=useState(""),[busy,setBusy]=useState(false);
 return <form className="info-card unit-card" onSubmit={async e=>{e.preventDefault();const form=e.currentTarget;const urls=String(new FormData(form).get("urls")||"").split(/\r?\n/).map(v=>v.trim()).filter(Boolean);if(!window.confirm("Replace this property’s published photo set?"))return;setBusy(true);try{const r=await fetch("/api/owner-photos",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({listingId,urls})}),d=await r.json();setMessage(d.message);}catch{setMessage("Could not save photos. Try again.");}finally{setBusy(false);}}}>
  <h2>Rental photos</h2><p>Paste up to eight public HTTPS image links, one per line. Use only photos you own or have permission to publish. Saving replaces the photo set without changing publication status.</p>
  <label>Photo links<textarea name="urls" rows={5} maxLength={16500} placeholder="https://…/your-property.jpg"/></label><button className="button button-outline" disabled={busy}>{busy?"Saving…":"Replace photos"}</button>{message&&<p role="status">{message}</p>}
 </form>;
}
