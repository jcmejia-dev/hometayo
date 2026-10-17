import {NextResponse} from "next/server";
import {currentUser} from "@/lib/session-user";
import {searchPlaces} from "@/lib/places-search";
export const dynamic="force-dynamic";
export async function GET(request:Request){
 const reply=(body:unknown,status=200)=>NextResponse.json(body,{status,headers:{"Cache-Control":"no-store"}});
 try{const user=await currentUser();if(!user)return reply({message:"Please sign in."},401);if(user.role!=="landlord")return reply({message:"A property-owner account is required."},403);
 const result=await searchPlaces(user.id,new URL(request.url).searchParams.get("q")?.trim()||"");return reply(result,result.status);
 }catch{return reply({message:"Address search is temporarily unavailable."},503);}
}
