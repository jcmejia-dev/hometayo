import {NextResponse} from "next/server";
import {put} from "@vercel/blob";
import {nativeAccount} from "@/lib/native-auth";

const MAX_BYTES=6*1024*1024;
const extensions:Record<string,string>={"image/jpeg":"jpg","image/png":"png","image/webp":"webp","application/pdf":"pdf"};

export async function POST(request:Request){
 const user=await nativeAccount(request);
 if(!user)return NextResponse.json({message:"Please sign in."},{status:401});
 try{
  const form=await request.formData();const file=form.get("file");
  if(!(file instanceof File))return NextResponse.json({message:"Choose a proof or rental document to upload."},{status:400});
  const extension=extensions[file.type];
  if(!extension)return NextResponse.json({message:"Use a JPG, PNG, WebP, or PDF file."},{status:415});
  if(file.size<=0||file.size>MAX_BYTES)return NextResponse.json({message:"Rental files must be 6 MB or smaller."},{status:413});
  const blob=await put(`rental-files/${user.id}/${crypto.randomUUID()}.${extension}`,file,{access:"public",addRandomSuffix:false});
  return NextResponse.json({url:blob.url});
 }catch{return NextResponse.json({message:"Rental file upload is temporarily unavailable."},{status:503});}
}
