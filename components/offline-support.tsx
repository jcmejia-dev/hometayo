"use client";

import {useEffect,useState} from "react";
import {usePathname} from "next/navigation";

// The offline browser stores ONLY a small snapshot of published public listing fields.
// It never stores sessions, messages, private documents, or payment data.
const KEY="hometayo.offline.web-public.v1";
type PublicListing={
 slug:string;title:string;description:string;city:string;barangay:string;
 propertyType:string;listingPurpose:string;monthlyRentCentavos:number;
 salePriceCentavos:number|null;ownerName:string;
};
type PublicSnapshot={version:1;savedAt:number;items:PublicListing[]};

function toPublicListing(value:unknown):PublicListing|null{
 if(!value||typeof value!=="object")return null;
 const r=value as Record<string,unknown>;
 if(typeof r.slug!=="string"||!/^[a-z0-9][a-z0-9-]{0,119}$/.test(r.slug)||typeof r.title!=="string"||typeof r.city!=="string")return null;
 return {
  slug:r.slug,title:r.title,description:typeof r.description==="string"?r.description:"",
  city:r.city,barangay:typeof r.barangay==="string"?r.barangay:"",
  propertyType:typeof r.propertyType==="string"?r.propertyType:"",
  listingPurpose:r.listingPurpose==="sale"?"sale":"rent",
  monthlyRentCentavos:typeof r.monthlyRentCentavos==="number"?r.monthlyRentCentavos:0,
  salePriceCentavos:typeof r.salePriceCentavos==="number"?r.salePriceCentavos:null,
  ownerName:typeof r.ownerName==="string"?r.ownerName:"",
 };
}
function rememberPublicListings(values:unknown[]){
 const incoming=values.map(toPublicListing).filter((item):item is PublicListing=>item!==null);
 if(!incoming.length)return;
 try{
  const old=JSON.parse(localStorage.getItem(KEY)||"null") as PublicSnapshot|null;
  const existing=old?.version===1&&Array.isArray(old.items)?old.items:[];
  const merged=new Map<string,PublicListing>();
  for(const item of [...incoming,...existing]){
   const valid=toPublicListing(item);
   if(valid&&!merged.has(valid.slug))merged.set(valid.slug,valid);
  }
  localStorage.setItem(KEY,JSON.stringify({version:1,savedAt:Date.now(),items:[...merged.values()].slice(0,80)} satisfies PublicSnapshot));
 }catch{/* Private browsing or full storage must not affect the website. */}
}
export function OfflineSupport(){
 const pathname=usePathname();
 const [online,setOnline]=useState(true);
 useEffect(()=>{
  const current=()=>setOnline(navigator.onLine);
  current();window.addEventListener("online",current);window.addEventListener("offline",current);
  if("serviceWorker" in navigator){
   const register=()=>{void navigator.serviceWorker.register("/sw.js",{scope:"/"}).catch(()=>{});};
   if(document.readyState==="complete")register();
   else window.addEventListener("load",register,{once:true});
   return ()=>{window.removeEventListener("online",current);window.removeEventListener("offline",current);window.removeEventListener("load",register);};
  }
  return ()=>{window.removeEventListener("online",current);window.removeEventListener("offline",current);};
 },[]);
 useEffect(()=>{
  if(!navigator.onLine)return;
  const isBrowse=pathname==="/rentals";
  const detail=pathname?.match(/^\/rentals\/([a-z0-9][a-z0-9-]{0,119})$/);
  if(!isBrowse&&!detail)return;
  const params=new URLSearchParams();
  let url="";
  if(isBrowse){
   const search=new URLSearchParams(window.location.search);
   params.set("city",search.get("city")?.trim().slice(0,80)||"Koronadal City");
   params.set("purpose","rent");
   for(const key of ["type","maxRent","bedrooms"]){const value=search.get(key);if(value)params.set(key,value);}
   url="/api/public/listings?"+params;
  }else url="/api/public/listings/"+encodeURIComponent(detail![1]);
  const controller=new AbortController();
  const timeout=setTimeout(()=>controller.abort(),8000);
  void fetch(url,{cache:"no-store",signal:controller.signal}).then(async response=>{
   if(!response.ok)return;
   const data=await response.json() as Record<string,unknown>;
   if(isBrowse&&Array.isArray(data.listings))rememberPublicListings(data.listings);
   else if(!isBrowse)rememberPublicListings([data]);
  }).catch(()=>{}).finally(()=>clearTimeout(timeout));
  return ()=>{clearTimeout(timeout);controller.abort();};
 },[pathname]);
 if(online)return null;
 return <aside role="status" aria-live="polite" style={{position:"fixed",left:12,right:12,bottom:14,zIndex:9998,margin:"auto",maxWidth:500,borderRadius:14,padding:"12px 16px",color:"#fff",background:"#173d32",boxShadow:"0 7px 24px #0003",fontSize:13,fontWeight:650,display:"flex",justifyContent:"space-between",alignItems:"center",gap:12}}>
  <span>Offline — live HomeTayo actions are unavailable.</span>
  <a href="/offline.html" style={{color:"#fff",textDecoration:"underline",whiteSpace:"nowrap"}}>Saved rentals</a>
 </aside>;
}
