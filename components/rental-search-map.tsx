"use client";
import {useEffect,useRef,useState} from "react";
import Link from "next/link";
import {MapPin,LocateFixed,Search} from "lucide-react";
import {loadGoogleMap} from "@/lib/google-web-map";
import {isPoint,distanceKm,type Point} from "@/lib/geo";
export type MapRental={id:string;slug:string;title:string;latitude:number|null;longitude:number|null;monthlyRentCentavos:number};
type Place=Point&{id:string;name:string;address:string};

export function RentalSearchMap({listings}:{listings:MapRental[]}){
 const [message,setMessage]=useState(""),[query,setQuery]=useState(""),[places,setPlaces]=useState<Place[]>([]),[center,setCenter]=useState<Point|null>(null),[label,setLabel]=useState(""),[busy,setBusy]=useState(false);
 const element=useRef<HTMLDivElement>(null),map=useRef<google.maps.Map|null>(null),generation=useRef(0);
 const key=process.env.NEXT_PUBLIC_GOOGLE_MAPS_WEB_API_KEY||"";
 const pinned=listings.filter((l):l is MapRental&Point=>isPoint(l));
 useEffect(()=>{
  if(!key||!element.current)return;let active=true;const circles:google.maps.Circle[]=[];let info:google.maps.InfoWindow|undefined;
  const error=()=>{if(active)setMessage("The map key could not be authorized. You can still explore the rental cards below.");};window.addEventListener("hometayo-map-error",error);
  void loadGoogleMap(key).then(g=>{
   if(!active||!element.current)return;const points=listings.filter((l):l is MapRental&Point=>isPoint(l));
   const instance=new g.Map(element.current,{center:{lat:points[0]?.latitude??12.88,lng:points[0]?.longitude??121.77},zoom:points.length?13:5,mapTypeControl:false,streetViewControl:false,gestureHandling:"cooperative"});map.current=instance;
   const bounds=new g.LatLngBounds();info=new g.InfoWindow();
   for(const l of points){const position={lat:l.latitude,lng:l.longitude};bounds.extend(position);const marker=new g.Circle({map:instance,center:position,radius:45,strokeColor:"#173d32",strokeWeight:2,fillColor:"#d39a42",fillOpacity:.95,clickable:true});circles.push(marker);marker.addListener("click",()=>{const box=document.createElement("div"),title=document.createElement("strong"),price=document.createElement("p"),link=document.createElement("a");title.textContent=l.title;price.textContent=new Intl.NumberFormat("en-PH",{style:"currency",currency:"PHP",maximumFractionDigits:0}).format(l.monthlyRentCentavos/100)+" / month";link.href="/rentals/"+encodeURIComponent(l.slug);link.textContent="View rental";box.append(title,price,link);info?.setContent(box);info?.setPosition(position);info?.open(instance);});}
   if(points.length>1)instance.fitBounds(bounds,50);
  }).catch(e=>{if(active)setMessage(e.message);});
  return()=>{active=false;map.current=null;info?.close();circles.forEach(c=>c.setMap(null));window.removeEventListener("hometayo-map-error",error);};
 },[key,listings]);
 useEffect(()=>{if(center&&map.current){map.current.panTo({lat:center.latitude,lng:center.longitude});map.current.setZoom(14);}},[center]);
 useEffect(()=>()=>{generation.current++;},[]);
 function select(p:Point,name:string){setCenter(p);setLabel(name);setPlaces([]);setMessage("");}
 async function search(){const term=query.trim();if(term.length<2||busy)return;const version=++generation.current;setBusy(true);try{const r=await fetch(`/api/places/search?q=${encodeURIComponent(term)}`,{signal:AbortSignal.timeout(10000)}),d=await r.json();if(!r.ok)throw Error(d.message);if(version===generation.current){setPlaces(d.places);setMessage(d.places.length?"Choose a destination to compare distances.":"No matching destination. Try a landmark and city.");}}catch(e){if(version===generation.current)setMessage(e instanceof Error?e.message:"Search unavailable.");}finally{if(version===generation.current)setBusy(false);}}
 const nearest=center?[...pinned].sort((a,b)=>distanceKm(center,a)-distanceKm(center,b)).slice(0,5):[];
 return <section className="rental-map-section" aria-label="Rental map"><div className="rental-map-heading"><div><p className="section-kicker">EXPLORE THE NEIGHBORHOOD</p><h2>See where your next place could be.</h2></div><span><MapPin size={15}/>{pinned.length} of {listings.length} results have map pins</span></div>
  <div className="rental-map-controls"><label><span className="sr-only">Search a destination</span><Search size={17}/><input value={query} onChange={e=>setQuery(e.target.value)} onKeyDown={e=>{if(e.key==="Enter"){e.preventDefault();void search();}}} placeholder="School, workplace or landmark and city" maxLength={150}/></label><button className="button button-primary" disabled={busy} onClick={()=>void search()}>{busy?"Searching…":"Find destination"}</button><button className="button button-outline" disabled={busy} onClick={()=>{if(!navigator.geolocation){setMessage("Location is unavailable. Search a destination instead.");return;}const version=++generation.current;setMessage("Finding your location…");navigator.geolocation.getCurrentPosition(p=>{if(version===generation.current)select(p.coords,"Your current location");},()=>{if(version===generation.current)setMessage("Location permission was denied or unavailable.");},{timeout:12000,maximumAge:0});}}><LocateFixed size={17}/>Use my location</button></div>
  {message&&<p role="status">{message}</p>}{places.length>0&&<div className="location-results">{places.map(p=><button className="location-result" key={p.id} onClick={()=>select(p,p.name)}><MapPin size={18}/><span><strong>{p.name}</strong><small>{p.address}</small></span></button>)}<small>Google Maps</small></div>}
  {key?<div className="rental-browse-map" ref={element} aria-label="Published rental locations"/>:<p className="map-setup-notice">The interactive map needs the website Google Maps key. Rental cards and destination distance comparisons remain available.</p>}
  {!pinned.length&&<p className="profile-help">No map pins for these results yet. Listings without owner-selected pins still appear in the results below.</p>}
  {center&&<div className="nearby-rentals"><h3>Closest matching rentals to {label}</h3><p className="profile-help">Straight-line distance, among the current search results. This is not a driving route.</p>{nearest.length?nearest.map(l=><Link href={`/rentals/${l.slug}`} key={l.id}><span>{l.title}</span><strong>{distanceKm(center,l).toFixed(1)} km</strong></Link>):<p>No matching rentals have a saved location to compare.</p>}</div>}
 </section>;
}
