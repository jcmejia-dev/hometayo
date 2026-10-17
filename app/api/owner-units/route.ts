import { NextResponse } from "next/server";
import { currentUser } from "@/lib/session-user";
import { ownedUnits } from "@/lib/rental-units";
import { uuidInput } from "@/lib/rental-unit-input";
export async function GET(request:Request){
 const user=await currentUser();if(!user)return NextResponse.json({message:"Please sign in."},{status:401});
 if(user.role!=="landlord")return NextResponse.json({message:"Owner account required."},{status:403});
 const id=uuidInput.safeParse(new URL(request.url).searchParams.get("listingId"));if(!id.success)return NextResponse.json({message:"Invalid property."},{status:400});
 if(process.env.ENABLE_RENTAL_MANAGEMENT!=="true")return NextResponse.json({message:"Room management is awaiting setup."},{status:503});
 try{return NextResponse.json({units:await ownedUnits(id.data,user.id)},{headers:{"Cache-Control":"no-store"}});}catch{return NextResponse.json({message:"Could not load rooms."},{status:503});}
}
