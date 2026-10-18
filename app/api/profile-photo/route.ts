import {NextResponse} from "next/server";
import {sql} from "drizzle-orm";
import {currentUser} from "@/lib/session-user";
import {getDatabase} from "@/lib/db";
import {validProfilePhoto} from "@/lib/profile-photo";
import {consumeRateLimit} from "@/lib/email-auth";
const reply=(data:unknown,status=200)=>NextResponse.json(data,{status,headers:{"Cache-Control":"no-store"}});
export async function GET(){
 const account=await currentUser();if(!account)return reply({message:"Please sign in."},401);
 try{const db=getDatabase();if(!db)throw Error();const result=await db.execute(sql`SELECT profile_photo FROM users WHERE id=${account.id}`);return reply({photo:result.rows[0]?.profile_photo||""});}
 catch{return reply({message:"Profile photos need the latest database migration (007)."},503);}
}
export async function POST(request:Request){
 if(request.headers.get("origin")!==new URL(request.url).origin)return reply({message:"Invalid origin."},403);
 const account=await currentUser();if(!account)return reply({message:"Please sign in."},401);
 try{
  const raw=await request.text();if(raw.length>181000)return reply({message:"Choose a smaller photo."},413);
  const {photo}=JSON.parse(raw);if(!validProfilePhoto(photo))return reply({message:"Use a JPG, PNG or WebP photo."},400);
  if(!await consumeRateLimit("profile-photo",account.id,20,3600))return reply({message:"Please try again later."},429);
  const db=getDatabase();if(!db)throw Error();await db.execute(sql`UPDATE users SET profile_photo=${photo||null},updated_at=now() WHERE id=${account.id}`);
  return reply({photo,message:"Profile photo saved."});
 }catch{return reply({message:"Could not save. Check database migration 007 and try again."},503);}
}
