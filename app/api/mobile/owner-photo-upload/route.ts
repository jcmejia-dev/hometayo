import {NextResponse} from "next/server";
import {put} from "@vercel/blob";
import {nativeAccount} from "@/lib/native-auth";

const MAX_BYTES=4*1024*1024;
const extensions:Record<string,string>={"image/jpeg":"jpg","image/png":"png","image/webp":"webp"};

export async function POST(request:Request){
  const user=await nativeAccount(request);
  if(!user)return NextResponse.json({message:"Please sign in."},{status:401});
  if(user.role!=="landlord")return NextResponse.json({message:"A property-owner account is required."},{status:403});
  try{
    const form=await request.formData();const file=form.get("file");
    if(!(file instanceof File))return NextResponse.json({message:"Choose a photo to upload."},{status:400});
    const extension=extensions[file.type];
    if(!extension)return NextResponse.json({message:"Use a JPG, PNG, or WebP image."},{status:415});
    if(file.size<=0||file.size>MAX_BYTES)return NextResponse.json({message:"Each photo must be 4 MB or smaller."},{status:413});
    const blob=await put(`rental-photos/${user.id}/${crypto.randomUUID()}.${extension}`,file,{access:"public",addRandomSuffix:false});
    return NextResponse.json({url:blob.url});
  }catch{return NextResponse.json({message:"Photo upload is temporarily unavailable."},{status:503});}
}
