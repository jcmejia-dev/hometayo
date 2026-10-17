"use client";
import {useCallback,useEffect,useRef,useState} from "react";
import {MapPin,Search,LocateFixed,CheckCircle2} from "lucide-react";
import {loadGoogleMap} from "@/lib/google-web-map";
import {isPoint,type Point} from "@/lib/geo";
type Place=Point&{id:string;name:string;address:string};
export function PropertyLocationPicker({initialPoint=null}:{initialPoint?:Point|null}){
 const [query,setQuery]=useState(""),[places,setPlaces]=useState<Place[]>([]),[point,setPoint]=useState<Point|null>(initialPoint),[label,setLabel]=useState(initialPoint?"Existing property location — adjust if needed":"");
 const [busy,setBusy]=useState(false),[message,setMessage]=useState(""),[mapError,setMapError]=useState("");
 const element=useRef<HTMLDivElement>(null),map=useRef<google.maps.Map|null>(null),pin=useRef<google.maps.Circle|null>(null),latestPoint=useRef<Point|null>(initialPoint),alive=useRef(false),generation=useRef(0);
 const key=process.env.NEXT_PUBLIC_GOOGLE_MAPS_WEB_API_KEY||"";
 const choose=useCallback((p:Point,name:string)=>{if(!isPoint(p))return;latestPoint.current=p;setPoint(p);setLabel(name);setMessage("Location selected. Check that the pin marks the property, then confirm below.");setPlaces([]);},[]);
 const invalidate=useCallback(()=>{generation.current++;},[]);
 useEffect(()=>{alive.current=true;return()=>{alive.current=false;invalidate();};},[invalidate]);
 useEffect(()=>{
  if(!key||!element.current)return;
  let live=true;const container=element.current;
  const authError=()=>{if(live)setMapError("The browser map needs its Google key settings checked. Address search and current location are still available.");};
  window.addEventListener("hometayo-map-error",authError);
  void loadGoogleMap(key).then(g=>{
   if(!live)return;const p=latestPoint.current;
   const instance=new g.Map(container,{center:p?{lat:p.latitude,lng:p.longitude}:{lat:12.88,lng:121.77},zoom:p?17:5,mapTypeControl:false,streetViewControl:false,fullscreenControl:true,gestureHandling:"cooperative"});
   const marker=new g.Circle({map:instance,center:p?{lat:p.latitude,lng:p.longitude}:instance.getCenter(),radius:18,fillColor:"#173d32",fillOpacity:.9,strokeColor:"#ffffff",strokeWeight:3,draggable:true,visible:!!p});map.current=instance;pin.current=marker;
   instance.addListener("click",(event:google.maps.MapMouseEvent)=>{if(event.latLng)choose({latitude:event.latLng.lat(),longitude:event.latLng.lng()},"Property pin selected on map");});
   marker.addListener("dragend",()=>{const center=marker.getCenter();if(center)choose({latitude:center.lat(),longitude:center.lng()},"Property pin adjusted on map");});
  }).catch(e=>{if(live)setMapError(e.message);});
  return()=>{live=false;window.removeEventListener("hometayo-map-error",authError);pin.current?.setMap(null);map.current=null;pin.current=null;};
 },[key,choose]);
 useEffect(()=>{if(point&&map.current&&pin.current){const center={lat:point.latitude,lng:point.longitude};map.current.panTo(center);map.current.setZoom(17);pin.current.setCenter(center);pin.current.setVisible(true);}},[point]);
 async function search(){if(busy)return;const term=query.trim();if(term.length<2){setMessage("Enter an address or landmark and city first.");return;}const version=++generation.current;setBusy(true);setMessage("Searching addresses…");try{const r=await fetch(`/api/owner-location?q=${encodeURIComponent(term)}`,{signal:AbortSignal.timeout(10000)}),d=await r.json();if(!r.ok)throw Error(d.message);if(alive.current&&version===generation.current){setPlaces(d.places);setMessage(d.places.length?"Choose the closest result, then adjust the pin if needed.":"No matching address. Try a nearby landmark and city, or use your current location.");}}catch(e){if(alive.current&&version===generation.current)setMessage(e instanceof Error?e.message:"Could not search addresses.");}finally{if(alive.current&&version===generation.current)setBusy(false);}}
 function locate(){if(busy)return;if(!navigator.geolocation){setMessage("Location is unavailable in this browser. Search an address instead.");return;}setBusy(true);setMessage("Finding your location…");navigator.geolocation.getCurrentPosition(position=>{if(!alive.current)return;choose(position.coords,"Your current location — adjust if the property is elsewhere");setBusy(false);},()=>{if(!alive.current)return;setMessage("Location access was denied or unavailable. Search an address or tap the map instead.");setBusy(false);},{enableHighAccuracy:true,timeout:12000,maximumAge:0});}
 return <fieldset className="property-location"><legend><MapPin size={19}/>Property location</legend><p>Find the property by address, use your location while at the property, or tap the map. No coordinates to type.</p>
  <div className="location-search"><label htmlFor="property-address-search">Search address or nearby landmark<input id="property-address-search" value={query} onChange={e=>setQuery(e.target.value)} maxLength={150} placeholder="Street, barangay, city or a nearby landmark" onKeyDown={e=>{if(e.key==="Enter"){e.preventDefault();void search();}}}/></label><button type="button" disabled={busy} className="button button-outline" onClick={()=>void search()}><Search size={17}/>Search address</button><button type="button" disabled={busy} className="button button-outline" onClick={locate}><LocateFixed size={17}/>Use my location</button></div>
  {message&&<p role="status">{message}</p>}<div className="location-results">{places.map(p=><button type="button" className="location-result" key={p.id} onClick={()=>choose(p,p.name)}><MapPin size={18}/><span><strong>{p.name}</strong><small>{p.address}</small></span></button>)}{!!places.length&&<small className="maps-attribution" translate="no">Google Maps</small>}</div>
  {key?<div ref={element} className="property-map" aria-label="Property map: tap to place the pin"/>:<p className="location-help">Search an address or use your current location to save a map pin. Interactive map adjustment will appear once browser maps are configured.</p>}
  {mapError&&<p role="status">{mapError}</p>}
  <input type="hidden" name="latitude" value={point?.latitude??""}/><input type="hidden" name="longitude" value={point?.longitude??""}/>
  {point?<><p className="location-selected"><CheckCircle2 size={18}/>{label}</p><label className="location-confirm"><input key={`${point.latitude},${point.longitude}`} type="checkbox" name="locationConfirmed" value="yes" required/><span>I confirm this pin marks the property and can be shown to renters.</span></label><button type="button" className="text-link" onClick={()=>{setPoint(null);latestPoint.current=null;setLabel("");pin.current?.setVisible(false);}}>Remove selected pin</button></>:<p className="location-help">You can submit without a pin. Adding one helps renters find the property and compare distances.</p>}
 </fieldset>;
}
