"use client";
import {useEffect,useRef,useState} from "react";
import Image from "next/image";
import {Camera,UserRound} from "lucide-react";

export function ProfilePhoto(){
 const [photo,setPhoto]=useState(""),[message,setMessage]=useState(""),[busy,setBusy]=useState(false);
 const input=useRef<HTMLInputElement>(null);
 useEffect(()=>{const c=new AbortController();void fetch("/api/profile-photo",{signal:c.signal,cache:"no-store"}).then(async r=>{const d=await r.json();if(r.ok)setPhoto(d.photo);else setMessage(d.message);}).catch(()=>{});return()=>c.abort();},[]);
 async function save(photo:string){const r=await fetch("/api/profile-photo",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({photo})}),d=await r.json();if(!r.ok)throw Error(d.message);setPhoto(d.photo);setMessage(d.message);}
 async function choose(file:File){
  if(!["image/jpeg","image/png","image/webp"].includes(file.type)||file.size>5000000){setMessage("Choose a JPG, PNG or WebP photo under 5 MB.");return;}
  setBusy(true);setMessage("");let url="";
  try{url=URL.createObjectURL(file);const img=new window.Image();img.src=url;await img.decode();const size=Math.min(img.width,img.height),canvas=document.createElement("canvas");canvas.width=256;canvas.height=256;const ctx=canvas.getContext("2d");if(!ctx)throw Error("Photo processing is unavailable.");ctx.drawImage(img,(img.width-size)/2,(img.height-size)/2,size,size,0,0,256,256);await save(canvas.toDataURL("image/jpeg",.82));}
  catch(e){setMessage(e instanceof Error?e.message:"Could not save photo.");}finally{if(url)URL.revokeObjectURL(url);setBusy(false);if(input.current)input.current.value="";}
 }
 return <div className="profile-photo-editor"><span className="profile-photo-preview">{photo?<Image src={photo} alt="Your profile photo" width={88} height={88} unoptimized/>:<UserRound size={38}/>}</span><input hidden ref={input} type="file" accept="image/jpeg,image/png,image/webp" aria-label="Choose profile photo" onChange={e=>{const file=e.target.files?.[0];if(file)void choose(file);}}/><button type="button" className="text-link" disabled={busy} onClick={()=>input.current?.click()}><Camera size={15}/>{busy?"Saving…":"Change profile photo"}</button>{photo&&<button className="text-link" disabled={busy} onClick={()=>{setBusy(true);void save("").catch(e=>setMessage(e.message)).finally(()=>setBusy(false));}}>Remove photo</button>}{message&&<p role="status">{message}</p>}</div>;
}
