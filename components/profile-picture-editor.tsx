"use client";
import Image from "next/image";
import {Camera,Palette,Trash2} from "lucide-react";
import {useEffect,useRef,useState} from "react";
import {AvatarEditor,AvatarFace} from "./avatar-editor";
import type {AvatarConfig} from "@/lib/avatar-config";
import styles from "./profile-picture-editor.module.css";

export function ProfilePictureEditor({initialAvatar,defaultCustomize=false}:{initialAvatar:AvatarConfig;defaultCustomize?:boolean}){
 const [photo,setPhoto]=useState("");
 const [mode,setMode]=useState<"photo"|"avatar">("avatar");
 const [customizing,setCustomizing]=useState(defaultCustomize);
 const [message,setMessage]=useState("");
 const [busy,setBusy]=useState(false);
 const input=useRef<HTMLInputElement>(null);
 const touched=useRef(defaultCustomize);
 useEffect(()=>{const c=new AbortController();void fetch("/api/profile-photo",{signal:c.signal,cache:"no-store"}).then(async r=>{const d=await r.json();if(!r.ok){setMessage(d.message||"Could not load your profile picture.");return;}const saved=typeof d.photo==="string"?d.photo:"";setPhoto(saved);if(saved&&!touched.current)setMode("photo");}).catch(()=>{});return()=>c.abort();},[]);
 async function savePhoto(photoValue:string){const r=await fetch("/api/profile-photo",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({photo:photoValue})});const d=await r.json();if(!r.ok)throw Error(d.message||"Could not save profile photo.");setPhoto(d.photo||"");setMessage(d.message||"Profile photo saved.");}
 async function choose(file:File){
  if(!["image/jpeg","image/png","image/webp"].includes(file.type)||file.size>5000000){setMessage("Choose a JPG, PNG or WebP photo under 5 MB.");return;}
  setBusy(true);setMessage("");let url="";
  try{url=URL.createObjectURL(file);const img=new window.Image();img.src=url;await img.decode();const size=Math.min(img.width,img.height),canvas=document.createElement("canvas");canvas.width=256;canvas.height=256;const ctx=canvas.getContext("2d");if(!ctx)throw Error("Photo processing is unavailable.");ctx.drawImage(img,(img.width-size)/2,(img.height-size)/2,size,size,0,0,256,256);await savePhoto(canvas.toDataURL("image/jpeg",.82));touched.current=true;setMode("photo");setCustomizing(false);}catch(e){setMessage(e instanceof Error?e.message:"Could not save photo.");}finally{if(url)URL.revokeObjectURL(url);setBusy(false);if(input.current)input.current.value="";}
 }
 function customize(){touched.current=true;setMode("avatar");setCustomizing(true);setMessage("Customize your avatar below, then save the profile to use it as your picture.");}
 return <div className={styles.wrap}>
  <input type="hidden" name="profileImageMode" value={mode}/>
  <div className={styles.identity}>
   <span className={styles.preview}>{mode==="photo"&&photo?<Image src={photo} alt="Your profile photo" width={96} height={96} unoptimized/>:<AvatarFace config={initialAvatar} size={96}/>}</span>
   <div className={styles.copy}><strong>Your profile picture</strong><p>Upload a real photo or use a HomeTayo avatar. You can switch anytime.</p><div className={styles.actions}><button type="button" className="button button-outline" disabled={busy} onClick={()=>input.current?.click()}><Camera size={16}/>{busy?"Saving…":"Upload photo"}</button><button type="button" className="button button-outline" onClick={customize}><Palette size={16}/>Customize avatar</button>{photo&&mode==="photo"&&<button type="button" className={styles.remove} disabled={busy} onClick={()=>{setBusy(true);void savePhoto("").then(()=>{touched.current=true;setMode("avatar");}).catch(e=>setMessage(e instanceof Error?e.message:"Could not remove photo.")).finally(()=>setBusy(false));}}><Trash2 size={15}/>Remove photo</button>}</div></div>
  </div>
  <input hidden ref={input} type="file" accept="image/jpeg,image/png,image/webp" aria-label="Choose profile photo" onChange={e=>{const file=e.target.files?.[0];if(file)void choose(file);}}/>
  {message&&<p className={styles.message} role="status">{message}</p>}
  {customizing&&<div className={styles.avatarArea}><AvatarEditor initial={initialAvatar}/></div>}
 </div>;
}
