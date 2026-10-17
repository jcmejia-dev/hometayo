import {FeedbackPressable as Pressable} from "./feedback-pressable";
import {usePalette,useThemedStyles} from "./theme";
import {useTheme} from "./theme";
import React,{useCallback,useEffect,useRef,useState} from "react";
import {ActivityIndicator,Alert,Image,Keyboard,ScrollView,Text,TextInput,View,StyleSheet} from "react-native";
import {NativeRentalSocial} from "./rental-workspace";
import MapView,{Circle,Marker,PROVIDER_GOOGLE} from "react-native-maps";
import * as Location from "expo-location";
import {withDeadline} from "./deadline";
import {useReducedMotion} from "./motion";
import {isExpoGo,mapsAvailable} from "./runtime";
import {api,type Account} from "./session";
import {Icon} from "./icons";
import {colors} from "./design";
import {rentLabel,propertyLabel,type Rental} from "./api";

import {demoLandmarks,selectDemoRentals} from "./demo-rentals";

type Point={latitude:number;longitude:number};
type Place=Point&{id:string;name:string;address:string};
type MapRental=Rental&{latitude:number|null;longitude:number|null;distanceKm:number|null;description?:string;photoUrls?:string[];unitCounts?:{total:number;available:number}|null};
const base=process.env.EXPO_PUBLIC_API_URL || "https://hometayoph.vercel.app";
function distance(a:Point,b:Point) {const rad=(v:number)=>v*Math.PI/180;const h=Math.sin(rad(b.latitude-a.latitude)/2)**2+Math.cos(rad(a.latitude))*Math.cos(rad(b.latitude))*Math.sin(rad(b.longitude-a.longitude)/2)**2;return 12742*Math.asin(Math.sqrt(Math.max(0,Math.min(1,h))));}
export function RentalMap({account,onSelect,onInquiry,initialCity="",initialType="",initialBudget=""}: {account:Account|null;onSelect:(slug:string)=>void;onInquiry?:(id:string)=>void;initialCity?:string;initialType?:string;initialBudget?:string}) {
  const colors=usePalette(); const s=useThemedStyles(baseStyles);

  const {theme}=useTheme();
  const reduced=useReducedMotion(),scroll=useRef<ScrollView>(null),actionY=useRef(0),alive=useRef(true),searchRunning=useRef(false),locatingRunning=useRef(false);
  const [searching,setSearching]=useState(false),[locating,setLocating]=useState(false),[actionMessage,setActionMessage]=useState("");
  const [mapLoaded,setMapLoaded]=useState(false),[mapSlow,setMapSlow]=useState(false);
  useEffect(()=>{alive.current=true;return()=>{alive.current=false;};},[]);
  useEffect(()=>{if(!mapsAvailable||mapLoaded)return;const timer=setTimeout(()=>setMapSlow(true),12000);return()=>clearTimeout(timer);},[mapLoaded]);
  function revealActions(){Keyboard.dismiss();requestAnimationFrame(()=>scroll.current?.scrollTo({y:Math.max(0,actionY.current-16),animated:!reduced}));}
  const [budget,setBudget]=useState(initialBudget);
  const [center,setCenter]=useState<Point|null>(null),[userLocation,setUserLocation]=useState<Point|null>(null),[label,setLabel]=useState("All locations"),[radius,setRadius]=useState(5);
  const [query,setQuery]=useState(""),[city,setCity]=useState(initialCity),[type,setType]=useState(initialType),[places,setPlaces]=useState<Place[]>([]),[rentals,setRentals]=useState<MapRental[]>([]),[error,setError]=useState(""),[busy,setBusy]=useState(false),[nextOffset,setNextOffset]=useState<number|null>(null);
  const [demo,setDemo]=useState(isExpoGo);
  const map=useRef<MapView>(null);
  const generation=useRef(0),loadAbort=useRef<AbortController|null>(null);
  const mapsConfigured=mapsAvailable;
  function choose(point:Point,name:string) {setCenter(point);setLabel(name);setPlaces([]);map.current?.animateToRegion({...point,latitudeDelta:.07,longitudeDelta:.07});}
  const load=useCallback(async(offset=0)=>{
    const current=++generation.current;loadAbort.current?.abort();
    setBusy(true);setError("");
    if(demo){setRentals(selectDemoRentals(center,radius,city,type).filter(r=>!budget||r.monthlyRentCentavos<=Number(budget)*100));setNextOffset(null);setBusy(false);return;}
    const params=new URLSearchParams({map:"1",offset:String(offset)});
    if(city.trim())params.set("city",city.trim());
    if(type)params.set("type",type);
    if(budget)params.set("maxRent",budget);
    if(center){params.set("lat",String(center.latitude));params.set("lng",String(center.longitude));params.set("radiusKm",String(radius));}
    const controller=new AbortController();loadAbort.current=controller;const timer=setTimeout(()=>controller.abort(),15000);
    try {
      const response=await fetch(base+"/api/public/listings?"+params,{signal:controller.signal});
      const data=await response.json();
      if(!response.ok)throw Error(data.message||"Could not load map rentals.");
      if(!Array.isArray(data.listings))throw Error("Map response unavailable.");
      if(current!==generation.current)return;
      setRentals(old=>offset?old.concat(data.listings):data.listings);setNextOffset(data.nextOffset);
    }catch(e){if(current===generation.current){setRentals([]);setError(controller.signal.aborted?"Rental search timed out. Check your connection and try again.":e instanceof Error?e.message:"Rentals unavailable.");}}
    finally{clearTimeout(timer);if(current===generation.current)setBusy(false);}
  },[center,radius,city,type,demo,budget]);
  useEffect(()=>{setBusy(true);const timer=setTimeout(()=>void load(),250);return()=>{clearTimeout(timer);generation.current++;loadAbort.current?.abort();};},[load]);
  async function locate() {
    if(locatingRunning.current)return;locatingRunning.current=true;setLocating(true);setActionMessage("Finding your current location…");revealActions();
    try {
      const permission=await Location.requestForegroundPermissionsAsync();
      if(permission.status!=="granted"){if(alive.current)setActionMessage("Location access was denied. You can still enter a city below.");return;}
      const point=(await withDeadline(Location.getCurrentPositionAsync({accuracy:Location.Accuracy.Balanced}),15000,"Location timed out")).coords;
      if(!alive.current)return;setUserLocation(point);setCity("");choose(point,"Your location");setActionMessage("Location found. Showing nearby rentals.");
    }catch {if(alive.current)setActionMessage("Could not find your location. Check location services or enter a city below.");}finally{locatingRunning.current=false;if(alive.current)setLocating(false);}
  }
  async function searchPlace() {
    if(searchRunning.current)return;
    const term=query.trim();if(term.length<2){setActionMessage("Enter a destination or landmark and its city.");revealActions();return;}
    searchRunning.current=true;setSearching(true);setPlaces([]);setActionMessage("Searching for destinations…");revealActions();
    try {
      if(demo){const matches=demoLandmarks.filter(p=>p.name.toLowerCase().includes(term.toLowerCase()));setPlaces(matches);setActionMessage(matches.length?"Choose a destination below to search nearby rentals.":"No demo destination matched. Try shopping centre or school.");return;}
      if(!account)throw Error("Sign in to search destinations. You can also filter by city below.");
      const results=(await api("/api/mobile/places?q="+encodeURIComponent(term))).places;
      if(!alive.current)return;setPlaces(results);setActionMessage(results.length?"Choose a destination below to search nearby rentals.":"No destinations found. Try the landmark name and city.");
    }catch(e){if(alive.current)setActionMessage(e instanceof Error?e.message:"Destination search unavailable. Try a city below.");}
    finally{searchRunning.current=false;if(alive.current)setSearching(false);}
  }
  const pinned=rentals.filter((r)=>typeof r.latitude==="number"&&typeof r.longitude==="number");
  useEffect(()=>{if(!center&&mapsConfigured&&pinned.length)map.current?.fitToCoordinates(pinned.map(r=>({latitude:r.latitude!,longitude:r.longitude!})),{edgePadding:{top:40,right:40,bottom:40,left:40},animated:true});},[rentals,center,mapsConfigured]);
  return <ScrollView ref={scroll} keyboardShouldPersistTaps="handled" contentContainerStyle={s.body}>
    {isExpoGo&&<View style={s.result}><Text style={s.bold}>{demo?"Demo rentals - fictional test data":"Live listings"}</Text><Text style={s.help}>{demo?"Six sample rentals with map pins and inclusions. None are available for rent. Search shopping centre or school to test nearest results.":"Published rentals from HomeTayo."}</Text><Pressable accessibilityRole="button" onPress={()=>{setDemo(!demo);setCenter(null);setCity("");setPlaces([]);setQuery("");setLabel("All locations");}}><Text style={s.bold}>{demo?"View real listings":"Try demo rentals"}</Text></Pressable></View>}
    <Text style={s.eyebrow}>YOUR NEXT NEIGHBOURHOOD</Text><Text style={s.heading}>Find your place.</Text>
    <Text style={s.help}>Search a destination, use your location, or long-press the map. Matching rentals are sorted nearest your chosen point.</Text>
    <TextInput accessibilityLabel="Destination or landmark" value={query} onChangeText={setQuery} placeholder={demo?"Try shopping centre or school":"e.g. KCC Mall, Koronadal"} style={s.input} onSubmitEditing={()=>void searchPlace()}/>
    <View onLayout={event=>{actionY.current=event.nativeEvent.layout.y;}}/>
    <Pressable accessibilityRole="button" disabled={searching} accessibilityState={{busy:searching}} onPress={()=>void searchPlace()} style={[s.button,{backgroundColor:theme.accent}]}>{searching?<ActivityIndicator color="white"/>:<Icon name="search" color="white" size={18}/>}<Text style={s.buttonText}>{searching?"Searching…":"Search destination"}</Text></Pressable>
    {actionMessage?<View style={s.placeholder}><Text accessibilityRole="alert" style={s.bold}>{actionMessage}</Text></View>:null}
    {places.map(place=><Pressable key={place.id} accessibilityRole="button" onPress={()=>{setCity("");choose(place,place.name);setActionMessage("Destination selected: "+place.name+". Rentals below are sorted nearest first.");}} style={s.result}><Text style={s.bold}>{place.name}</Text><Text style={s.help}>{place.address}</Text></Pressable>)}
    <View style={s.row}><Pressable accessibilityRole="button" disabled={locating} accessibilityState={{busy:locating}} onPress={()=>void locate()} style={s.chip}>{locating?<ActivityIndicator size="small" color={colors.green}/>:<Icon name="location" size={16}/>}<Text style={s.chipText}>{locating?"Finding your location…":"Use my location"}</Text></Pressable><Pressable accessibilityRole="button" onPress={()=>{setCenter(null);setCity("");setLabel("All locations");setPlaces([]);setActionMessage("Showing rentals across all locations.");}} style={s.chip}><Icon name="pin" size={16}/><Text style={s.chipText}>All locations</Text></Pressable></View>
    <TextInput accessibilityLabel="Filter city" value={city} onChangeText={setCity} placeholder="Filter by city (optional)" style={s.input}/>
    <View style={s.row}>{["","house","apartment","boarding_house","bedspace"].map(value=><Pressable accessibilityRole="radio" accessibilityState={{checked:value===type}} key={value} onPress={()=>setType(value)} style={[s.chip,value===type&&{backgroundColor:colors.border}]}><Text style={s.chipText}>{value?propertyLabel(value):"All types"}</Text></Pressable>)}</View>
    {center&&<View style={s.row}>{[1,3,5,10,25].map(km=><Pressable accessibilityRole="button" key={km} onPress={()=>setRadius(km)} style={[s.chip,radius===km&&{backgroundColor:colors.border}]}><Text style={s.chipText}>{km} km</Text></Pressable>)}</View>}
    <TextInput accessibilityLabel="Maximum monthly rent" value={budget} onChangeText={setBudget} keyboardType="number-pad" placeholder="Maximum monthly rent (PHP) · optional" style={s.input} maxLength={7}/>
    <Text style={s.bold}>{center?"Near "+label:label}</Text>
    {mapsConfigured?<MapView ref={map} provider={PROVIDER_GOOGLE} style={s.map} loadingEnabled onMapLoaded={()=>{setMapLoaded(true);setMapSlow(false);}} initialRegion={demo?{...demoLandmarks[0],latitudeDelta:.16,longitudeDelta:.16}:{latitude:12.88,longitude:121.77,latitudeDelta:15,longitudeDelta:15}} onLongPress={e=>{setCity("");choose(e.nativeEvent.coordinate,"Selected map point");}}>
      {demo&&demoLandmarks.map(p=><Marker key={p.id} coordinate={p} title={p.name} description={p.address} pinColor="#8765aa" onCalloutPress={()=>{setCity("");choose(p,p.name);}}/>)}
      {center&&<><Marker coordinate={center} title={label} pinColor="#c58c3c"/><Circle center={center} radius={radius*1000} strokeColor={colors.green} fillColor="#173d3215"/></>}
      {userLocation&&<Marker coordinate={userLocation} title="Your location" pinColor="#4285f4"/>}
      {pinned.map(r=><Marker key={r.slug} coordinate={{latitude:r.latitude!,longitude:r.longitude!}} title={r.title} description={rentLabel(r.monthlyRentCentavos)+" /month"} onCalloutPress={()=>onSelect(r.slug)}/>)}
    </MapView>:<View style={s.placeholder}><Text style={s.bold}>Map unavailable in this app version</Text><Text style={s.help}>You can still browse by city or use your location to find nearby rentals. A map-enabled Android build is needed to display the map.</Text></View>}
    {mapsConfigured&&!mapLoaded&&<View style={s.row}><ActivityIndicator color={colors.green}/><Text style={s.help}>{mapSlow?"The map is taking longer than expected. Check your connection; rental browsing is still available.":"Loading the map…"}</Text></View>}
    {error?<Text accessibilityRole="alert" style={s.help}>{error}</Text>:null}
    {busy&&<View style={s.row}><ActivityIndicator color={colors.green}/><Text style={s.bold}>Finding matching rentals…</Text></View>}
    <Text style={s.help}>Distances are straight-line estimates, not driving or walking routes. Your location is used only when requested; there is no background tracking.</Text>
    {!center&&rentals.length>pinned.length&&<Text style={s.help}>{rentals.length-pinned.length} rentals have no owner-provided pin and appear in the list only.</Text>}
    {!busy&&!rentals.length&&!error&&<Text style={s.help}>No published rentals match this area. Try a wider radius or all locations.</Text>}
    <View style={s.resultsHeader}><Text style={s.resultsTitle}>{rentals.length} {demo?"demo ":""}rentals</Text><Text style={s.help}>{center?"Nearest first":"Explore all"}</Text></View>
    {rentals.map(r=><View key={r.slug} style={s.rentalCard}><Pressable accessibilityRole="button" accessibilityLabel={"View "+r.title} onPress={()=>onSelect(r.slug)} style={{gap:12}}>
      {r.photoUrls?.[0]?.startsWith("https://")&&<Image source={{uri:r.photoUrls[0]}} accessibilityLabel={r.title} style={{width:"100%",height:190,borderRadius:16}}/>}
      <View style={s.rentalTop}><View style={s.rentalIcon}><Icon name={r.propertyType==="house"?"home":r.propertyType==="bedspace"?"bed":"building"} size={30}/></View><View style={{flex:1,gap:5}}><Text style={s.eyebrow}>{propertyLabel(r.propertyType).toUpperCase()}</Text><Text style={s.rentalTitle}>{r.title}</Text><Text style={s.help}>{r.barangay}, {r.city}</Text></View><Icon name="chevron" size={18} color={colors.sage}/></View>
      <View style={s.rentalFacts}><Icon name="bed" size={16} color={colors.sage}/><Text style={s.help}>{r.bedrooms??"—"} beds</Text><Icon name="bath" size={16} color={colors.sage}/><Text style={s.help}>{r.bathrooms??"—"} baths</Text></View>
      {!!r.description&&<Text style={s.help} numberOfLines={3}>{r.description}</Text>}
      {!!r.unitCounts?.total&&<Text style={s.bold}>{r.unitCounts.available} of {r.unitCounts.total} units available{r.unitCounts.available===0?" · Currently full":""}</Text>}
      <View style={s.rentalBottom}><Text style={s.price}>{rentLabel(r.monthlyRentCentavos)}<Text style={s.help}> /month</Text></Text>{r.distanceKm!==null&&<View style={s.distanceTag}><Icon name="pin" size={13}/><Text style={s.chipText}>{r.distanceKm.toFixed(1)} km</Text></View>}</View>
      {r.distanceKm!==null&&<Text style={s.help}>From {label}</Text>}{userLocation&&typeof r.latitude==="number"&&typeof r.longitude==="number"&&<Text style={s.help}>{distance(userLocation,{latitude:r.latitude,longitude:r.longitude}).toFixed(1)} km from your location</Text>}
    </Pressable>{!demo&&onInquiry&&<NativeRentalSocial slug={r.slug} onInquiry={onInquiry}/>}</View>)}
    {nextOffset!==null&&<Pressable accessibilityRole="button" disabled={busy} onPress={()=>void load(nextOffset)} style={[s.button,{backgroundColor:theme.accent}]}><Text style={s.buttonText}>Load more rentals</Text></Pressable>}
  </ScrollView>;
}
const baseStyles=StyleSheet.create({body:{padding:20,paddingBottom:40,gap:12},eyebrow:{fontSize:9,letterSpacing:1.2,fontWeight:"800",color:colors.sage},heading:{fontSize:30,fontWeight:"800",letterSpacing:-1,color:colors.green},help:{fontSize:12,lineHeight:20,color:colors.muted},input:{borderWidth:1,borderColor:colors.border,borderRadius:14,padding:15,backgroundColor:colors.white,color:colors.ink,fontSize:13},button:{backgroundColor:colors.green,padding:16,borderRadius:14,alignItems:"center",justifyContent:"center",flexDirection:"row",gap:10},buttonText:{color:"white",fontWeight:"800"},row:{flexDirection:"row",flexWrap:"wrap",gap:8},chip:{padding:12,minHeight:44,borderRadius:12,backgroundColor:colors.white,borderWidth:1,borderColor:colors.border,flexDirection:"row",alignItems:"center",gap:7},chipText:{fontSize:11,fontWeight:"700",color:colors.green},result:{backgroundColor:colors.white,padding:17,borderRadius:18,gap:8,borderWidth:1,borderColor:colors.border},bold:{fontWeight:"800",color:colors.green},map:{height:330,borderRadius:22},placeholder:{padding:24,backgroundColor:colors.soft,borderRadius:22,gap:14},resultsHeader:{flexDirection:"row",justifyContent:"space-between",alignItems:"center",marginTop:8},resultsTitle:{fontSize:19,fontWeight:"800",color:colors.green},rentalCard:{backgroundColor:colors.white,padding:18,borderRadius:22,borderWidth:1,borderColor:colors.border,gap:12},rentalTop:{flexDirection:"row",alignItems:"center",gap:12},rentalIcon:{width:64,height:72,borderRadius:18,backgroundColor:colors.soft,alignItems:"center",justifyContent:"center"},rentalTitle:{fontSize:15,fontWeight:"800",color:colors.green},rentalFacts:{flexDirection:"row",gap:8,alignItems:"center"},rentalBottom:{flexDirection:"row",justifyContent:"space-between",alignItems:"center",paddingTop:12,borderTopWidth:1,borderColor:colors.border},price:{fontSize:21,fontWeight:"800",color:colors.green},distanceTag:{flexDirection:"row",gap:4,alignItems:"center",backgroundColor:colors.soft,borderRadius:9,padding:8}});
