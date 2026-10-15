"use client";
import {useEffect,useState,useSyncExternalStore} from "react";
const themes=[{id:"forest",name:"Forest",color:"#173d32"},{id:"ocean",name:"Ocean",color:"#174e70"},{id:"plum",name:"Plum",color:"#633c68"}];
const key="hometayo.theme.v1";
function read(){try{return localStorage.getItem(key)||"forest";}catch{return "forest";}}
function apply(value:string){document.documentElement.dataset.theme=themes.some(t=>t.id===value)?value:"forest";}
export function ThemeRestore(){useEffect(()=>{apply(read());const changed=(e:StorageEvent)=>{if(e.key===key)apply(e.newValue||"forest");};window.addEventListener("storage",changed);return()=>window.removeEventListener("storage",changed);},[]);return null;}
function subscribe(callback:()=>void){window.addEventListener("storage",callback);return()=>window.removeEventListener("storage",callback);}
export function ThemeSettings(){const saved=useSyncExternalStore(subscribe,read,()=>"forest");const [choice,setTheme]=useState<string|null>(null),[message,setMessage]=useState("");const theme=choice||saved;return <section className="info-card appearance-card"><p className="section-kicker">MAKE IT YOURS</p><h2>Appearance</h2><p className="profile-help">Choose an accent color. Saved on this browser.</p><div className="theme-options" role="group" aria-label="Theme color">{themes.map(t=><button key={t.id} type="button" aria-pressed={theme===t.id} onClick={()=>{apply(t.id);setTheme(t.id);try{localStorage.setItem(key,t.id);setMessage(t.name+" theme saved.");}catch{setMessage("Theme applied for this visit. Browser storage is unavailable.");}}}><span style={{background:t.color}}/>{t.name}</button>)}</div><p role="status" className="profile-help">{message}</p></section>;}
