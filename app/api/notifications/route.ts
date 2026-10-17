import {NextResponse} from "next/server";
import {currentUser} from "@/lib/session-user";
import {notificationState} from "@/lib/rental-operations";

export const dynamic="force-dynamic";
export async function GET(){
  const headers={"Cache-Control":"no-store"};
  const user=await currentUser();
  if(!user)return NextResponse.json({message:"Please sign in."},{status:401,headers});
  try{return NextResponse.json({notifications:await notificationState(user.id)},{headers});}
  catch{return NextResponse.json({message:"Notifications are unavailable. Please try again."},{status:503,headers});}
}
