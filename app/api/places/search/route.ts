import {NextResponse} from "next/server";
import {currentUser} from "@/lib/session-user";
import {searchPlaces} from "@/lib/places-search";
export async function GET(request:Request){
 const account=await currentUser();
 if(!account)return NextResponse.json({message:"Sign in to search destinations."},{status:401,headers:{"Cache-Control":"no-store"}});
 const result=await searchPlaces(account.id,new URL(request.url).searchParams.get("q")||"");
 return NextResponse.json(result,{status:result.status,headers:{"Cache-Control":"no-store"}});
}
