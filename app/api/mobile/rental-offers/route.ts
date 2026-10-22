import {NextResponse} from "next/server";
import {nativeAccount} from "@/lib/native-auth";
import {performRentalOfferAction,rentalOfferState} from "@/lib/rental-offer-service";
import {uuidInput} from "@/lib/rental-unit-input";

export const dynamic="force-dynamic";
const reply=(body:unknown,status=200)=>NextResponse.json(body,{status,headers:{"Cache-Control":"no-store"}});

export async function GET(request:Request){
 const user=await nativeAccount(request);if(!user)return reply({message:"Please sign in."},401);
 const conversationId=new URL(request.url).searchParams.get("conversationId")||"";
 if(!uuidInput.safeParse(conversationId).success)return reply({message:"Choose a rental conversation."},400);
 return reply(await rentalOfferState(user.id,conversationId));
}

export async function POST(request:Request){
 const user=await nativeAccount(request);if(!user)return reply({message:"Please sign in."},401);
 let raw:unknown;try{raw=await request.json();}catch{return reply({message:"Invalid request."},400);}
 try{return reply(await performRentalOfferAction(user.id,raw));}
 catch(error){return reply({message:error instanceof Error?error.message:"Could not update the offer."},409);}
}
