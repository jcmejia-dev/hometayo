"use client";
import {useState} from "react";
import {ImagePlus,LoaderCircle} from "lucide-react";
import {MAX_RENTAL_PHOTOS,uploadRentalPhotos} from "@/lib/client-rental-photo-upload";

export function OwnerPhotoForm({listingId}:{listingId:string}){
 const [message,setMessage]=useState(""),[busy,setBusy]=useState(false),[progress,setProgress]=useState("");
 return <form className="info-card unit-card" onSubmit={async e=>{
  e.preventDefault();const form=e.currentTarget;const input=form.elements.namedItem("photos");const files=input instanceof HTMLInputElement&&input.files?Array.from(input.files):[];
  if(!files.length){setMessage("Choose at least one photo first.");return;}
  if(!window.confirm("Replace this property’s published photo set with the selected files?"))return;
  setBusy(true);setMessage("");setProgress(`Uploading 0 of ${files.length} photos…`);
  try{
   const urls=await uploadRentalPhotos(files,(done,total)=>setProgress(`Uploading ${done} of ${total} photos…`));
   setProgress("Saving photo set…");
   const r=await fetch("/api/owner-photos",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({listingId,urls})}),d=await r.json();
   if(!r.ok)throw Error(d.message||"Could not save photos.");
   form.reset();setMessage(d.message||"Photos saved.");
  }catch(error){setMessage(error instanceof Error?error.message:"Could not save photos. Try again.");}
  finally{setBusy(false);setProgress("");}
 }}>
  <h2>Rental photos</h2>
  <p>Upload up to {MAX_RENTAL_PHOTOS} JPG, PNG, or WebP images directly from your device. Each image can be up to 4 MB. Saving replaces the current published photo set without changing publication status.</p>
  <label className="rental-photo-picker"><span><ImagePlus size={19}/> Choose rental photos</span><input name="photos" type="file" accept="image/jpeg,image/png,image/webp" multiple required disabled={busy}/><small>Select up to {MAX_RENTAL_PHOTOS} photos you own or have permission to publish.</small></label>
  <button className="button button-outline" disabled={busy}>{busy?<><LoaderCircle size={17} className="submission-spinner"/>{progress||"Uploading…"}</>:"Replace photos"}</button>
  {progress&&<p role="status">{progress}</p>}{message&&<p role="status">{message}</p>}
 </form>;
}
