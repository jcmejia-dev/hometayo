import {NextResponse} from "next/server";
import {put} from "@vercel/blob";
import {nativeAccount,nativeDb} from "@/lib/native-auth";

const MAX_BYTES=4*1024*1024;
const extensions:Record<string,string>={"image/jpeg":"jpg","image/png":"png","image/webp":"webp"};
const reply=(data:unknown,status=200)=>NextResponse.json(data,{status,headers:{"Cache-Control":"no-store"}});

export async function GET(request:Request){
 const user=await nativeAccount(request);if(!user)return reply({message:"Please sign in."},401);
 try{const rows=await nativeDb().query("SELECT profile_photo FROM users WHERE id=$1",[user.id]);return reply({photo:rows[0]?.profile_photo||""});}
 catch{return reply({message:"Profile photo is temporarily unavailable."},503);}
}

export async function POST(request:Request){
 const user=await nativeAccount(request);if(!user)return reply({message:"Please sign in."},401);
 try{
  if((request.headers.get("content-type")||"").includes("application/json")){
   const body=await request.json();
   if(body?.remove!==true)return reply({message:"Invalid profile photo request."},400);
   await nativeDb().query("UPDATE users SET profile_photo=NULL,updated_at=now() WHERE id=$1",[user.id]);
   return reply({photo:"",message:"Using your HomeTayo avatar."});
  }
  const form=await request.formData();const file=form.get("file");
  if(!(file instanceof File))return reply({message:"Choose a photo to upload."},400);
  const extension=extensions[file.type];
  if(!extension)return reply({message:"Use a JPG, PNG, or WebP image."},415);
  if(file.size<=0||file.size>MAX_BYTES)return reply({message:"Profile photo must be 4 MB or smaller."},413);
  const blob=await put(`profile-photos/${user.id}/${crypto.randomUUID()}.${extension}`,file,{access:"public",addRandomSuffix:false});
  await nativeDb().query("UPDATE users SET profile_photo=$2,updated_at=now() WHERE id=$1",[user.id,blob.url]);
  return reply({url:blob.url,photo:blob.url,message:"Profile photo saved."});
 }catch{return reply({message:"Profile photo upload is temporarily unavailable."},503);}
}
