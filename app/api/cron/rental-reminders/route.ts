import {NextResponse} from "next/server";
import {syncRentalLifecycle} from "@/lib/rental-lifecycle";

export const dynamic="force-dynamic";
export async function GET(request:Request){
 const secret=process.env.CRON_SECRET;
 if(secret&&request.headers.get("authorization")!==`Bearer ${secret}`)return NextResponse.json({message:"Unauthorized"},{status:401});
 try{await syncRentalLifecycle();return NextResponse.json({ok:true});}
 catch(error){console.error("Rental lifecycle cron failed",error);return NextResponse.json({message:"Rental reminder sweep failed"},{status:500});}
}
