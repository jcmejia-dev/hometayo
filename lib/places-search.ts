import "server-only";
import {isPoint} from "./geo";
import {consumeRateLimit} from "./email-auth";
export async function searchPlaces(accountId:string,query:string){
 if(query.length<2||query.length>150)return {status:400,message:"Enter an address or landmark and its city."};
 if(!process.env.GOOGLE_PLACES_API_KEY)return {status:503,message:"Address search is awaiting setup. You can use your current location or choose on the map."};
 if(!await consumeRateLimit("places",accountId,30,3600))return {status:429,message:"Address search limit reached. Use your current location or choose on the map."};
 const response=await fetch("https://places.googleapis.com/v1/places:searchText",{
  method:"POST",signal:AbortSignal.timeout(8000),headers:{"Content-Type":"application/json","X-Goog-Api-Key":process.env.GOOGLE_PLACES_API_KEY,"X-Goog-FieldMask":"places.id,places.displayName,places.formattedAddress,places.location"},
  body:JSON.stringify({textQuery:query,pageSize:5,regionCode:"PH"}),
 });
 if(!response.ok)return {status:503,message:"Address search is temporarily unavailable. Use your current location or choose on the map."};
 const data=await response.json();
 return {status:200,places:(Array.isArray(data.places)?data.places:[]).filter((p:{location?:unknown})=>isPoint(p.location)).map((p:{id:string;displayName?:{text:string};formattedAddress?:string;location:{latitude:number;longitude:number}})=>({id:p.id,name:p.displayName?.text||p.formattedAddress||"Selected place",address:p.formattedAddress||"",...p.location}))};
}
