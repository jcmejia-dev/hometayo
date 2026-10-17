import { NextResponse } from "next/server";
import { nativeAccount } from "@/lib/native-auth";
import { reactionState } from "@/lib/rental-operations";
export async function GET(request:Request){const slug=new URL(request.url).searchParams.get("slug")||"";if(!/^[a-z0-9][a-z0-9-]{0,119}$/.test(slug))return NextResponse.json({message:"Invalid rental."},{status:400});try{return NextResponse.json(await reactionState(slug,(await nativeAccount(request))?.id),{headers:{"Cache-Control":"no-store"}});}catch{return NextResponse.json({message:"Reactions unavailable."},{status:503});}}
