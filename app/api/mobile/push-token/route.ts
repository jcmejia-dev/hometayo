import {NextResponse} from "next/server";
import {nativeAccount} from "@/lib/native-auth";
import {registerMobilePushToken} from "@/lib/push-notifications";

export const dynamic="force-dynamic";

export async function POST(request:Request){
 const account=await nativeAccount(request);if(!account)return NextResponse.json({message:"Unauthorized."},{status:401});
 const body=await request.json().catch(()=>null) as {token?:unknown;platform?:unknown}|null;
 const token=typeof body?.token==="string"?body.token:"";
 const platform=body?.platform==="ios"?"ios":"android";
 try{await registerMobilePushToken(account.id,token,platform);return NextResponse.json({ok:true});}
 catch(e){return NextResponse.json({message:e instanceof Error?e.message:"Could not register notifications."},{status:400});}
}
