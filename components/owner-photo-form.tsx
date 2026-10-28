"use client";
import {useState} from "react";
import {ImagePlus,LoaderCircle,Trash2} from "lucide-react";
import {MAX_RENTAL_PHOTOS,uploadRentalPhotos} from "@/lib/client-rental-photo-upload";
import styles from "./rental-photo-upload.module.css";

export function OwnerPhotoForm({listingId,existingUrls=[]}:{listingId:string;existingUrls?:string[]}){
 const [kept,setKept]=useState(existingUrls),[message,setMessage]=useState(""),[busy,setBusy]=useState(false),[progress,setProgress]=useState("");
 return <form className="info-card unit-card" onSubmit={async e=>{
  e.preventDefault();const form=e.currentTarget;const input=form.elements.namedItem("photos");const files=input instanceof HTMLInputElement&&input.files?Array.from(input.files):[];
  if(kept.length+files.length>MAX_RENTAL_PHOTOS){setMessage(`Keep and add up to ${MAX_RENTAL_PHOTOS} photos total.`);return;}
  if(!files.length&&kept.length===existingUrls.length&&kept.every((url,i)=>url===existingUrls[i])){setMessage("No photo changes to save.");return;}
  if(!window.confirm("Save these property photo changes?"))return;
  setBusy(true);setMessage("");setProgress(files.length?`Uploading 0 of ${files.length} new photos…`:"Saving photo set…");
  try{
   const uploaded=files.length?await uploadRentalPhotos(files,(done,total)=>setProgress(`Uploading ${done} of ${total} new photos…`)):[];
   const urls=[...kept,...uploaded];setProgress("Saving photo set…");
   const r=await fetch("/api/owner-photos",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({listingId,urls})}),d=await r.json();
   if(!r.ok)throw Error(d.message||"Could not save photos.");
   setKept(urls);form.reset();setMessage(urls.length?"Property photos updated.":"All property photos removed.");
  }catch(error){setMessage(error instanceof Error?error.message:"Could not save photos. Try again.");}
  finally{setBusy(false);setProgress("");}
 }}>
  <h2>Property photos</h2>
  <p>Keep, remove, or add up to {MAX_RENTAL_PHOTOS} JPG, PNG, or WebP images. Each new image can be up to 4 MB. Saving does not change publication status.</p>
  {kept.length>0&&<div className={styles.gallery}>{kept.map((url,i)=><div className={styles.photoCard} key={url}><img src={url} alt={`Property photo ${i+1}`}/><button type="button" disabled={busy} onClick={()=>{setKept(v=>v.filter(x=>x!==url));setMessage("");}}><Trash2 size={15}/> Remove</button></div>)}</div>}
  {!kept.length&&<p className={styles.empty}>No saved photos. Add photos below.</p>}
  <label className={styles.picker}><span><ImagePlus size={19}/> Add property photos</span><input name="photos" type="file" accept="image/jpeg,image/png,image/webp" multiple disabled={busy}/><small>{kept.length} saved · add up to {Math.max(0,MAX_RENTAL_PHOTOS-kept.length)} more photos.</small></label>
  <button className="button button-outline" disabled={busy}>{busy?<><LoaderCircle size={17} className="submission-spinner"/>{progress||"Saving…"}</>:"Save photo changes"}</button>
  {progress&&<p role="status">{progress}</p>}{message&&<p role="status">{message}</p>}
 </form>;
}
