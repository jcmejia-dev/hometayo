import React,{useCallback,useEffect,useRef,useState} from "react";
import {ActivityIndicator,Alert,Pressable,ScrollView,Text,TextInput,View,StyleSheet} from "react-native";
import MapView,{Circle,Marker,PROVIDER_GOOGLE} from "react-native-maps";
import * as Location from "expo-location";
import {isExpoGo,mapsAvailable} from "./runtime";
import {api,type Account} from "./session";
import {rentLabel,type Rental} from "./api";

import {demoLandmarks,selectDemoRentals} from "./demo-rentals";

type Point={latitude:number;longitude:number};
type Place=Point&{id:string;name:string;address:string};
type MapRental=Rental&{latitude:number|null;longitude:number|null;distanceKm:number|null};
const base=process.env.EXPO_PUBLIC_API_URL || "https://hometayoph.vercel.app";
function distance(a:Point,b:Point) {const rad=(v:number)=>v*Math.PI/180;const h=Math.sin(rad(b.latitude-a.latitude)/2)**2+Math.cos(rad(a.latitude))*Math.cos(rad(b.latitude))*Math.sin(rad(b.longitude-a.longitude)/2)**2;return 12742*Math.asin(Math.sqrt(Math.max(0,Math.min(1,h))));}
export function RentalMap({account,onSelect,initialCity="",initialType=""}: {account:Account|null;onSelect:(slug:string)=>void;initialCity?:string;initialType?:string}) {
  const [center,setCenter]=useState<Point|null>(null),[userLocation,setUserLocation]=useState<Point|null>(null),[label,setLabel]=useState("All locations"),[radius,setRadius]=useState(5);
  const [query,setQuery]=useState(""),[city,setCity]=useState(initialCity),[type,setType]=useState(initialType),[places,setPlaces]=useState<Place[]>([]),[rentals,setRentals]=useState<MapRental[]>([]),[error,setError]=useState(""),[busy,setBusy]=useState(false),[nextOffset,setNextOffset]=useState<number|null>(null);
  const [demo,setDemo]=useState(isExpoGo);
  const map=useRef<MapView>(null);
  const generation=useRef(0);
  const mapsConfigured=mapsAvailable;
  function choose(point:Point,name:string) {setCenter(point);setLabel(name);setPlaces([]);map.current?.animateToRegion({...point,latitudeDelta:.07,longitudeDelta:.07});}
  const load=useCallback(async(offset=0)=>{
    const current=++generation.current;
    setBusy(true);setError("");
    if(demo){setRentals(selectDemoRentals(center,radius,city,type));setNextOffset(null);setBusy(false);return;}
    const params=new URLSearchParams({map:"1",offset:String(offset)});
    if(city.trim())params.set("city",city.trim());
    if(type)params.set("type",type);
    if(center){params.set("lat",String(center.latitude));params.set("lng",String(center.longitude));params.set("radiusKm",String(radius));}
    try {
      const response=await fetch(base+"/api/public/listings?"+params);
      const data=await response.json();
      if(!response.ok)throw Error(data.message||"Could not load map rentals.");
      if(!Array.isArray(data.listings))throw Error("Map response unavailable.");
      if(current!==generation.current)return;
      setRentals(old=>offset?old.concat(data.listings):data.listings);setNextOffset(data.nextOffset);
    }catch(e){if(current===generation.current){setRentals([]);setError(e instanceof Error?e.message:"Map unavailable.");}}
    finally{if(current===generation.current)setBusy(false);}
  },[center,radius,city,type,demo]);
  useEffect(()=>{void load();return()=>{generation.current++;};},[load]);
  async function locate() {
    try {
      const permission=await Location.requestForegroundPermissionsAsync();
      if(permission.status!=="granted"){setError("Location permission was denied. Search a destination or choose a point on the map instead.");return;}
      const point=(await Location.getCurrentPositionAsync({accuracy:Location.Accuracy.Balanced})).coords;
      setUserLocation(point);setCity("");choose(point,"Your location");
    }catch {setError("Could not find your location. Use a destination or a map point instead.");}
  }
  async function searchPlace() {
    if(demo){const matches=demoLandmarks.filter(p=>p.name.toLowerCase().includes(query.trim().toLowerCase()));setPlaces(matches);setError(matches.length?"":"Try shopping centre or school. These are fictional test landmarks.");return;}
    try {if(!account)throw Error("Sign in to search destinations, or long-press the map to choose a point.");setPlaces((await api("/api/mobile/places?q="+encodeURIComponent(query))).places);setError("");}
    catch(e){setError(e instanceof Error?e.message:"Destination search unavailable.");}
  }
  const pinned=rentals.filter((r)=>typeof r.latitude==="number"&&typeof r.longitude==="number");
  useEffect(()=>{if(!center&&mapsConfigured&&pinned.length)map.current?.fitToCoordinates(pinned.map(r=>({latitude:r.latitude!,longitude:r.longitude!})),{edgePadding:{top:40,right:40,bottom:40,left:40},animated:true});},[rentals,center,mapsConfigured]);
  return <ScrollView contentContainerStyle={s.body}>
    {isExpoGo&&<View style={s.result}><Text style={s.bold}>{demo?"Demo rentals - fictional test data":"Live listings"}</Text><Text style={s.help}>{demo?"Six sample rentals with map pins and inclusions. None are available for rent. Search shopping centre or school to test nearest results.":"Published rentals from HomeTayo."}</Text><Pressable accessibilityRole="button" onPress={()=>{setDemo(!demo);setCenter(null);setCity("");setPlaces([]);setQuery("");setLabel("All locations");}}><Text style={s.bold}>{demo?"View real listings":"Try demo rentals"}</Text></Pressable></View>}
    <Text style={s.heading}>Find a home near what matters.</Text>
    <Text style={s.help}>Search a destination, use your location, or long-press the map. Matching rentals are sorted nearest your chosen point.</Text>
    <TextInput accessibilityLabel="Destination or landmark" value={query} onChangeText={setQuery} placeholder={demo?"Try shopping centre or school":"e.g. KCC Mall, Koronadal"} style={s.input} onSubmitEditing={()=>void searchPlace()}/>
    <Pressable accessibilityRole="button" onPress={()=>void searchPlace()} style={s.button}><Text style={s.buttonText}>Search destination</Text></Pressable>
    {places.map(place=><Pressable key={place.id} accessibilityRole="button" onPress={()=>{setCity("");choose(place,place.name);}} style={s.result}><Text style={s.bold}>{place.name}</Text><Text style={s.help}>{place.address}</Text></Pressable>)}
    <View style={s.row}><Pressable accessibilityRole="button" onPress={()=>void locate()} style={s.chip}><Text>Use my location</Text></Pressable><Pressable accessibilityRole="button" onPress={()=>{setCenter(null);setCity("");setLabel("All locations");}} style={s.chip}><Text>All locations</Text></Pressable></View>
    <TextInput accessibilityLabel="Filter city" value={city} onChangeText={setCity} placeholder="Any city (optional exact city filter)" style={s.input}/>
    <View style={s.row}>{["","house","apartment","boarding_house","bedspace"].map(value=><Pressable accessibilityRole="radio" accessibilityState={{checked:value===type}} key={value} onPress={()=>setType(value)} style={[s.chip,value===type&&{backgroundColor:"#dcebdc"}]}><Text>{value.replaceAll("_"," ")||"All types"}</Text></Pressable>)}</View>
    {center&&<View style={s.row}>{[1,3,5,10,25].map(km=><Pressable accessibilityRole="button" key={km} onPress={()=>setRadius(km)} style={[s.chip,radius===km&&{backgroundColor:"#dcebdc"}]}><Text>{km} km</Text></Pressable>)}</View>}
    <Text style={s.bold}>{center?"Near "+label:label}</Text>
    {mapsConfigured?<MapView ref={map} provider={PROVIDER_GOOGLE} style={s.map} initialRegion={demo?{...demoLandmarks[0],latitudeDelta:.16,longitudeDelta:.16}:{latitude:12.88,longitude:121.77,latitudeDelta:15,longitudeDelta:15}} onLongPress={e=>{setCity("");choose(e.nativeEvent.coordinate,"Selected map point");}}>
      {demo&&demoLandmarks.map(p=><Marker key={p.id} coordinate={p} title={p.name} description={p.address} pinColor="#8765aa" onCalloutPress={()=>{setCity("");choose(p,p.name);}}/>)}
      {center&&<><Marker coordinate={center} title={label} pinColor="#c58c3c"/><Circle center={center} radius={radius*1000} strokeColor="#173d32" fillColor="#173d3215"/></>}
      {userLocation&&<Marker coordinate={userLocation} title="Your location" pinColor="#4285f4"/>}
      {pinned.map(r=><Marker key={r.slug} coordinate={{latitude:r.latitude!,longitude:r.longitude!}} title={r.title} description={rentLabel(r.monthlyRentCentavos)+" /month"} onCalloutPress={()=>onSelect(r.slug)}/>)}
    </MapView>:<View style={s.placeholder}><Text style={s.bold}>Map setup pending</Text><Text style={s.help}>The Android map key needs to be configured in the signed app. You can still browse all locations and use your location to sort rentals.</Text></View>}
    {error?<Text accessibilityRole="alert" style={s.help}>{error}</Text>:null}
    {busy&&<ActivityIndicator/>}
    <Text style={s.help}>Distances are straight-line estimates, not driving or walking routes. Your location is used only when requested; there is no background tracking.</Text>
    {!center&&rentals.length>pinned.length&&<Text style={s.help}>{rentals.length-pinned.length} rentals have no owner-provided pin and appear in the list only.</Text>}
    {!busy&&!rentals.length&&!error&&<Text style={s.help}>No published rentals match this area. Try a wider radius or all locations.</Text>}
    {rentals.map(r=><Pressable key={r.slug} accessibilityRole="button" onPress={()=>onSelect(r.slug)} style={s.result}><Text style={s.bold}>{r.title}</Text><Text style={s.help}>{r.barangay}, {r.city} · {rentLabel(r.monthlyRentCentavos)}/month</Text><Text style={s.help}>{r.distanceKm===null?"Distance unavailable":r.distanceKm.toFixed(1)+" km from "+label}</Text>{userLocation&&typeof r.latitude==="number"&&typeof r.longitude==="number"&&<Text style={s.help}>{distance(userLocation,{latitude:r.latitude,longitude:r.longitude}).toFixed(1)} km from your location</Text>}</Pressable>)}
    {nextOffset!==null&&<Pressable accessibilityRole="button" disabled={busy} onPress={()=>void load(nextOffset)} style={s.button}><Text style={s.buttonText}>Load more rentals</Text></Pressable>}
  </ScrollView>;
}
const s=StyleSheet.create({body:{padding:20,paddingBottom:40,gap:12},heading:{fontSize:27,fontWeight:"900",color:"#173d32"},help:{fontSize:12,lineHeight:20,color:"#65746d"},input:{borderWidth:1,borderColor:"#dce4da",borderRadius:10,padding:13,backgroundColor:"white"},button:{backgroundColor:"#173d32",padding:15,borderRadius:10,alignItems:"center"},buttonText:{color:"white",fontWeight:"800"},row:{flexDirection:"row",flexWrap:"wrap",gap:8},chip:{padding:12,borderRadius:9,backgroundColor:"white",borderWidth:1,borderColor:"#dce4da"},result:{backgroundColor:"white",padding:17,borderRadius:13,gap:8},bold:{fontWeight:"800",color:"#173d32"},map:{height:330,borderRadius:15},placeholder:{padding:24,backgroundColor:"#e7eee4",borderRadius:15,gap:14}});
