import {NextResponse} from "next/server";
import {savePhotos} from "./rental-photos";
export async function photoPost(request:Request,userId:string|null){
 if(!userId)return NextResponse.json({message:"Please sign in."},{status:401});
 try{const raw=await request.text();if(raw.length>18000)return NextResponse.json({message:"Too many photo details."},{status:413});await savePhotos(userId,JSON.parse(raw));return NextResponse.json({message:"Photos saved. Publication status is unchanged."});}
 catch{return NextResponse.json({message:"Could not save photos. Check owner access and use up to eight public HTTPS image links."},{status:400});}
}
