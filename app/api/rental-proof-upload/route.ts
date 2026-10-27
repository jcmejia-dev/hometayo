import {NextResponse} from "next/server";
import {put} from "@vercel/blob";
import {currentUser} from "@/lib/session-user";
import {consumeRateLimit} from "@/lib/email-auth";

const MAX_BYTES=6*1024*1024;
const extensions:Record<string,string>={"image/jpeg":"jpg","image/png":"png","image/webp":"webp"};
const reply=(data:unknown,status=200)=>NextResponse.json(data,{status,headers:{"Cache-Control":"no-store"}});

export async function POST(request:Request){
 if(request.headers.get("origin")!==new URL(request.url).origin)return reply({message:"Invalid origin."},403);
 const user=await currentUser();if(!user)return reply({message:"Please sign in."},401);
 if(!await consumeRateLimit("rental-proof-upload",user.id,30,3600))return reply({message:"Too many uploads. Please try again later."},429);
 try{
  const form=await request.formData();const file=form.get("file");
  if(!(file instanceof File))return reply({message:"Choose a payment proof or maintenance photo."},400);
  const extension=extensions[file.type];if(!extension)return reply({message:"Use a JPG, PNG, or WebP image."},415);
  if(file.size<=0||file.size>MAX_BYTES)return reply({message:"Images must be 6 MB or smaller."},413);
  const blob=await put(`rental-proof/${user.id}/${crypto.randomUUID()}.${extension}`,file,{access:"public",addRandomSuffix:false});
  return reply({url:blob.url});
 }catch{return reply({message:"Upload is temporarily unavailable."},503);}
}
