import {NextResponse} from "next/server";
import {put} from "@vercel/blob";
import {currentUser} from "@/lib/session-user";

const MAX_BYTES=4*1024*1024;
const extensions:Record<string,string>={"image/jpeg":"jpg","image/png":"png","image/webp":"webp"};

export async function POST(request:Request){
 if(request.headers.get("origin")!==new URL(request.url).origin)return NextResponse.json({message:"Invalid origin."},{status:403});
 const user=await currentUser();
 if(!user)return NextResponse.json({message:"Please sign in."},{status:401});
 if(user.role!=="landlord")return NextResponse.json({message:"A property-owner account is required."},{status:403});
 try{
  const form=await request.formData();
  const file=form.get("file");
  if(!(file instanceof File))return NextResponse.json({message:"Choose a photo to upload."},{status:400});
  const extension=extensions[file.type];
  if(!extension)return NextResponse.json({message:"Use a JPG, PNG, or WebP image."},{status:415});
  if(file.size<=0||file.size>MAX_BYTES)return NextResponse.json({message:"Each photo must be 4 MB or smaller."},{status:413});
  const blob=await put(`rental-photos/${user.id}/${crypto.randomUUID()}.${extension}`,file,{access:"public",addRandomSuffix:false});
  return NextResponse.json({url:blob.url});
 }catch(error){
  console.error("Rental photo upload failed",{message:error instanceof Error?error.message:"UPLOAD_FAILED"});
  return NextResponse.json({message:"Photo upload is unavailable. Connect a Vercel Blob store to this project, then try again."},{status:503});
 }
}
