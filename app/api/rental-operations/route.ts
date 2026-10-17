import { currentUser } from "@/lib/session-user";
import { operationGet,operationPost } from "@/lib/rental-operation-http";
import { NextResponse } from "next/server";
export const dynamic="force-dynamic";
export async function GET(request:Request){return operationGet(request,(await currentUser())?.id??null);}
export async function POST(request:Request){
 const origin=request.headers.get("origin");
 if(!origin||origin!==new URL(request.url).origin)return NextResponse.json({message:"Invalid request origin."},{status:403});
 return operationPost(request,(await currentUser())?.id??null);
}
