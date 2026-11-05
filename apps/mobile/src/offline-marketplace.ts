/**
 * Public-only offline marketplace snapshots.
 * No sessions, conversations, payment records, or other private data are stored here.
 * Cached listings are read-only and may be outdated or no longer available.
 */
import AsyncStorage from "@react-native-async-storage/async-storage";
import {File,Paths} from "expo-file-system";
import {fetchRentalDetail,fetchRentals,type Rental,type RentalDetail} from "./api";

const LIST_KEY="hometayo.offline.public-listings.v1";
const DETAIL_KEY="hometayo.offline.public-details.v1";
const FETCH_TIMEOUT_MS=9000;
const MAX_LISTINGS=80;
const MAX_DETAILS=25;
type ListingEntry={item:Rental;savedAt:number};
type DetailEntry={item:RentalDetail;savedAt:number};
type Cache<T>={version:1;entries:T[]};
export type OfflineResult<T>={data:T;offline:boolean;savedAt:string|null;summaryOnly?:boolean};

function validSlug(slug:unknown):slug is string{
 return typeof slug==="string"&&/^[a-z0-9][a-z0-9-]{0,119}$/.test(slug);
}
function validListing(row:unknown):row is Rental{
 if(!row||typeof row!=="object")return false;
 const item=row as Rental;
 return validSlug(item.slug)&&typeof item.title==="string"&&typeof item.city==="string"&&typeof item.description==="string";
}
async function readCache<T>(key:string,validate:(entry:unknown)=>entry is T):Promise<T[]>{
 try{
  const raw=await AsyncStorage.getItem(key);
  if(!raw)return [];
  const parsed=JSON.parse(raw) as Cache<T>;
  return parsed?.version===1&&Array.isArray(parsed.entries)?parsed.entries.filter(validate):[];
 }catch{return [];}
}
const validListEntry=(v:unknown):v is ListingEntry=>{
 if(!v||typeof v!=="object")return false;
 const e=v as ListingEntry;return validListing(e.item)&&Number.isFinite(e.savedAt);
};
const validDetailEntry=(v:unknown):v is DetailEntry=>{
 if(!v||typeof v!=="object")return false;
 const e=v as DetailEntry;return validListing(e.item)&&Number.isFinite(e.savedAt);
};
function newestBySlug<T extends {item:{slug:string};savedAt:number}>(entries:T[],max:number):T[]{
 const unique=new Map<string,T>();
 for(const entry of entries.sort((a,b)=>b.savedAt-a.savedAt))
  if(!unique.has(entry.item.slug))unique.set(entry.item.slug,entry);
 return [...unique.values()].slice(0,max);
}
async function rememberListings(listings:Rental[]){
 try{
  const prior=await readCache(LIST_KEY,validListEntry);
  const savedAt=Date.now();
  const next=newestBySlug([...listings.filter(validListing).map(item=>({item,savedAt})),...prior],MAX_LISTINGS);
  await AsyncStorage.setItem(LIST_KEY,JSON.stringify({version:1,entries:next}));
 }catch{/* Storage full or unavailable: online browsing must continue. */}
}
async function rememberDetail(detail:RentalDetail){
 try{
  const prior=await readCache(DETAIL_KEY,validDetailEntry);
  const next=newestBySlug([{item:detail,savedAt:Date.now()},...prior],MAX_DETAILS);
  await AsyncStorage.setItem(DETAIL_KEY,JSON.stringify({version:1,entries:next}));
 }catch{/* Never block online browsing because of local storage. */}
}
function photoFile(uri:string):File|null{
 if(!uri.startsWith("https://"))return null;
 let hash=2166136261;
 for(let i=0;i<uri.length;i++){hash=Math.imul(hash^uri.charCodeAt(i),16777619);}
 const pathname=new URL(uri).pathname.toLowerCase();
 const ext=pathname.endsWith(".png")?"png":pathname.endsWith(".webp")?"webp":"jpg";
 return new File(Paths.cache,"hometayo-public-"+(hash>>>0).toString(16)+"."+ext);
}
async function savePhoto(uri:string){
 try{
  const target=photoFile(uri);
  if(!target||target.exists)return;
  await File.downloadFileAsync(uri,target);
 }catch{/* A photo can fail without invalidating the cached listing text. */}
}
function savedPhoto(uri:string|null|undefined){
 if(!uri)return uri||null;
 try{const file=photoFile(uri);return file?.exists?file.uri:uri;}catch{return uri;}
}
function warmPhotos(uris:(string|null|undefined)[]){
 void (async()=>{for(const uri of [...new Set(uris.filter((x):x is string=>typeof x==="string"))].slice(0,12))await savePhoto(uri);})();
}
function imageReadyListing(item:Rental):Rental{
 return {...item,photoUrl:savedPhoto(item.photoUrl)};
}
function imageReadyDetail(item:RentalDetail):RentalDetail{
 return {...imageReadyListing(item),photoUrls:item.photoUrls?.map(uri=>savedPhoto(uri)||uri)};
}
async function timed<T>(operation:(signal:AbortSignal)=>Promise<T>,parent?:AbortSignal):Promise<T>{
 const controller=new AbortController();
 const cancel=()=>controller.abort();
 if(parent?.aborted)throw Error("Request cancelled.");
 parent?.addEventListener("abort",cancel,{once:true});
 const timer=setTimeout(cancel,FETCH_TIMEOUT_MS);
 try{return await operation(controller.signal);}
 finally{clearTimeout(timer);parent?.removeEventListener("abort",cancel);}
}
function checkFallbackAllowed(error:unknown,signal?:AbortSignal){
 if(signal?.aborted)throw Error("Request cancelled.");
 const message=error instanceof Error?error.message:"";
 if(/not available|invalid property|invalid response|incomplete response/i.test(message))throw error;
}
const normalized=(s:string)=>s.trim().toLocaleLowerCase();
function matches(item:Rental,city:string,type:string,purpose:string){
 return (!city||normalized(item.city).includes(normalized(city)))&&(!type||item.propertyType===type)&&(!purpose||item.listingPurpose===purpose);
}
export async function loadRentals(city:string,type:string="",purpose:""|"rent"|"sale"="",signal?:AbortSignal):Promise<OfflineResult<Rental[]>>{
 try{
  const listings=await timed(s=>fetchRentals(city,type,purpose,s),signal);
  await rememberListings(listings);
  warmPhotos(listings.map(item=>item.photoUrl));
  return {data:listings,offline:false,savedAt:null};
 }catch(error){
  checkFallbackAllowed(error,signal);
  const cache=await readCache(LIST_KEY,validListEntry);
  if(!cache.length)throw Error("No saved listings yet. Connect to the internet once to save properties for offline viewing.");
  const matchesInCache=cache.filter(x=>matches(x.item,city,type,purpose));
  const minSaved=matchesInCache.length?Math.min(...matchesInCache.map(x=>x.savedAt)):Math.max(...cache.map(x=>x.savedAt));
  return {data:matchesInCache.map(x=>imageReadyListing(x.item)),offline:true,savedAt:new Date(minSaved).toISOString()};
 }
}
export async function loadRentalDetail(slug:string,signal?:AbortSignal):Promise<OfflineResult<RentalDetail>>{
 try{
  const detail=await timed(s=>fetchRentalDetail(slug,s),signal);
  await rememberDetail(detail);
  warmPhotos([detail.photoUrl,...(detail.photoUrls||[])]);
  return {data:detail,offline:false,savedAt:null};
 }catch(error){
  checkFallbackAllowed(error,signal);
  const details=await readCache(DETAIL_KEY,validDetailEntry);
  const detail=details.find(e=>e.item.slug===slug);
  if(detail)return {data:imageReadyDetail(detail.item),offline:true,savedAt:new Date(detail.savedAt).toISOString()};
  const listings=await readCache(LIST_KEY,validListEntry);
  const summary=listings.find(e=>e.item.slug===slug);
  if(summary){
   const item:RentalDetail={...summary.item,photoUrls:summary.item.photoUrl?[summary.item.photoUrl]:[],province:"",furnished:"Not recorded",availableSlots:null,contactUrl:null};
   return {data:imageReadyDetail(item),offline:true,savedAt:new Date(summary.savedAt).toISOString(),summaryOnly:true};
  }
  throw Error("This rental has not been saved on this device. Open it while connected to view it offline later.");
 }
}
