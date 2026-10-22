import {NextResponse} from "next/server";
import {currentUser} from "@/lib/session-user";
import {performRentalOfferAction,rentalOfferState} from "@/lib/rental-offers";
import {uuidInput} from "@/lib/rental-unit-input";

export const dynamic="force-dynamic";
const reply=(body:unknown,status=200)=>NextResponse.json(body,{status,headers:{"Cache-Control":"no-store"}});

export async function GET(request:Request){
 const user=await currentUser();if(!user)return reply({message:"Please sign in."},401);
 const conversationId=new URL(request.url).searchParams.get("conversationId")||"";
 if(!uuidInput.safeParse(conversationId).success)return reply({message:"Choose a rental conversation."},400);
 return reply(await rentalOfferState(user.id,conversationId));
}

export async function POST(request:Request){
 const user=await currentUser();if(!user)return reply({message:"Please sign in."},401);
 const origin=request.headers.get("origin");if(!origin||origin!==new URL(request.url).origin)return reply({message:"Invalid request origin."},403);
 let raw:unknown;try{raw=await request.json();}catch{return reply({message:"Invalid request."},400);}
 try{return reply(await performRentalOfferAction(user.id,raw));}
 catch(error){return reply({message:error instanceof Error?error.message:"Could not update the offer."},409);}
}
