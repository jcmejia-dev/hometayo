import "server-only";
import { NextResponse } from "next/server";
import { performOperation, operationsState } from "./rental-operations";
import { rentalOperation } from "./rental-operation-input";
import { consumeRateLimit } from "./email-auth";
const reply=(body:unknown,status=200)=>NextResponse.json(body,{status,headers:{"Cache-Control":"no-store"}});
export async function operationGet(request:Request,userId:string|null){
 if(!userId)return reply({message:"Please sign in."},401);
 try {const p=new URL(request.url).searchParams;return reply(await operationsState(userId,p.get("conversationId")||undefined,p.get("month")||undefined,p.get("before")||undefined));}
 catch {return reply({message:"Rental management is unavailable. Check server setup and try again."},503);}
}
export async function operationPost(request:Request,userId:string|null){
 if(!userId)return reply({message:"Please sign in."},401);
 if(process.env.ENABLE_RENTAL_MANAGEMENT!=="true")return reply({message:"Rental management is awaiting setup."},503);
 let raw;try{raw=await request.text();}catch{return reply({message:"Invalid request."},400);}
 if(raw.length>6000)return reply({message:"Request too large."},413);
 let body;try{body=JSON.parse(raw);}catch{return reply({message:"Invalid request."},400);}
 if(!rentalOperation.safeParse(body).success)return reply({message:"Check your details, dates, and amounts."},400);
 try{
  if(!await consumeRateLimit("rental-operations",userId,60,60))return reply({message:"Please wait a moment before trying again."},429);
  return reply(await performOperation(userId,body));
 }catch{return reply({message:"Could not save. Check permission, room availability, duplicate entries, and dates."},409);}
}
