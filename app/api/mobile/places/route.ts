import { NextResponse } from "next/server";
import { nativeAccount } from "@/lib/native-auth";
import { consumeRateLimit } from "@/lib/email-auth";
export const dynamic="force-dynamic";
export async function GET(request:Request) {
  const reply=(body:unknown,status=200)=>NextResponse.json(body,{status,headers:{"Cache-Control":"no-store"}});
  try {
    const account=await nativeAccount(request);
    if(!account)return reply({message:"Sign in to search destinations, or select a point on the map."},401);
    if(!process.env.GOOGLE_PLACES_API_KEY)return reply({message:"Destination search is awaiting Maps setup. You can select a point on the map."},503);
    const query=new URL(request.url).searchParams.get("q")?.trim() || "";
    if(query.length<2 || query.length>150)return reply({message:"Enter a place name and city."},400);
    if(!await consumeRateLimit("places",account.id,30,3600))return reply({message:"Place-search limit reached. Try later or select the map."},429);
    const response=await fetch("https://places.googleapis.com/v1/places:searchText",{method:"POST",signal:AbortSignal.timeout(8000),headers:{"Content-Type":"application/json","X-Goog-Api-Key":process.env.GOOGLE_PLACES_API_KEY,"X-Goog-FieldMask":"places.id,places.displayName,places.formattedAddress,places.location"},body:JSON.stringify({textQuery:query,pageSize:5})});
    if(!response.ok)return reply({message:"Destination search unavailable. Try the map instead."},503);
    const data=await response.json();
    return reply({places:(data.places||[]).map((p:{id:string;displayName?:{text:string};formattedAddress:string;location:{latitude:number;longitude:number}})=>({id:p.id,name:p.displayName?.text,address:p.formattedAddress,...p.location}))});
  } catch {return reply({message:"Destination search temporarily unavailable."},503);}
}
