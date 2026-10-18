export const MAX_RENTAL_PHOTOS=8;
export const MAX_RENTAL_PHOTO_BYTES=4*1024*1024;
export const RENTAL_PHOTO_TYPES=["image/jpeg","image/png","image/webp"] as const;

export async function uploadRentalPhotos(files:File[],onProgress?:(done:number,total:number)=>void){
 if(files.length>MAX_RENTAL_PHOTOS)throw Error(`Choose up to ${MAX_RENTAL_PHOTOS} photos.`);
 const urls:string[]=[];
 for(const file of files){
  if(!RENTAL_PHOTO_TYPES.includes(file.type as (typeof RENTAL_PHOTO_TYPES)[number]))throw Error(`${file.name}: use JPG, PNG, or WebP.`);
  if(file.size<=0||file.size>MAX_RENTAL_PHOTO_BYTES)throw Error(`${file.name}: each photo must be 4 MB or smaller.`);
  const body=new FormData();body.set("file",file);
  const response=await fetch("/api/owner-photo-upload",{method:"POST",body});
  const data=await response.json().catch(()=>({message:"Photo upload failed."}));
  if(!response.ok||typeof data.url!=="string")throw Error(data.message||`Could not upload ${file.name}.`);
  urls.push(data.url);onProgress?.(urls.length,files.length);
 }
 return urls;
}
