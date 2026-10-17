import "server-only";
import {neon} from "@neondatabase/serverless";
import {photoInput,photoUrl,SAVE_PHOTOS} from "./rental-photo-input";
export async function savePhotos(userId:string,body:unknown){
 const v=photoInput.parse(body);if(!process.env.DATABASE_URL||process.env.ENABLE_RENTAL_MANAGEMENT!=="true")throw Error("Rental management is awaiting setup.");
 const rows=await neon(process.env.DATABASE_URL).query(SAVE_PHOTOS,[v.listingId,userId,JSON.stringify(v.urls)]);
 if(!rows.length)throw Error("Property access denied.");
}
export function safePhotoUrls(urls:unknown[]):string[]{return urls.filter((u):u is string=>photoUrl.safeParse(u).success);}
