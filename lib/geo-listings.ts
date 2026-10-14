import "server-only";
import { neon } from "@neondatabase/serverless";
import { buildMapQuery } from "@/lib/geo-query";
export async function browseMapRentals(url:URL) {
  const {query,params,offset}=buildMapQuery(url);
  if(!process.env.DATABASE_URL)throw Error("Database unavailable");
  const rows=await neon(process.env.DATABASE_URL).query(query,params);
  return {state:"ready",listings:rows.slice(0,100).map(row=>{const result={...row};delete result.published_at;return result;}),nextOffset:rows.length>100?offset+100:null};
}
