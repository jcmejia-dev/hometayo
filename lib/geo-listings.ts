import "server-only";
import { neon } from "@neondatabase/serverless";
import { buildMapQuery } from "@/lib/geo-query";
import {safePhotoUrls} from "./rental-photos";
export async function browseMapRentals(url:URL) {
  const {query,params,offset}=buildMapQuery(url,process.env.ENABLE_RENTAL_MANAGEMENT==="true");
  if(!process.env.DATABASE_URL)throw Error("Database unavailable");
  const rows=await neon(process.env.DATABASE_URL).query(query,params);
  return {state:"ready",listings:rows.slice(0,100).map(row=>{const result:Record<string,unknown>={...row,photoUrls:safePhotoUrls(row.photoUrls||[])};delete result.published_at;return result;}),nextOffset:rows.length>100?offset+100:null};
}
