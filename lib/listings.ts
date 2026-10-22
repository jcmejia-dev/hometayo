import "server-only";
import {neon} from "@neondatabase/serverless";
import { and, desc, eq, gte, ilike, lte, sql, type SQL } from "drizzle-orm";
import { getDatabase } from "@/lib/db";
import { listings } from "@/db/schema";
import type { RentalFilters } from "@/lib/search-filters";

export type PublicListing = Pick<typeof listings.$inferSelect,
  "id" | "slug" | "title" | "propertyType" | "city" | "barangay"
  | "monthlyRentCentavos" | "bedrooms" | "bathrooms" | "rentalMode" | "lastConfirmedAt"> & {
    listingPurpose:"rent"|"sale";salePriceCentavos:number|null;
    latitude?:number|null;longitude?:number|null;description:string;photoUrls:string[];
    unitCounts:{total:number;available:number}|null;ownerName:string;ownerPhoto:string|null;
  };
export type BrowseResult =
  | { state: "not_configured" | "error"; listings: [] }
  | { state: "ready"; listings: PublicListing[] };

async function marketplaceSchemaReady(){
 const url=process.env.DATABASE_URL;if(!url)return false;
 try{const rows=await neon(url).query(`SELECT count(*)::int AS count FROM information_schema.columns WHERE table_schema='public' AND table_name='listings' AND column_name IN ('listing_purpose','sale_price_centavos')`);return Number(rows[0]?.count)===2;}catch{return false;}
}
const publicFields=(marketplace:boolean)=>({
  id: listings.id, slug: listings.slug, title: listings.title,
  propertyType: listings.propertyType, city: listings.city, barangay: listings.barangay,
  listingPurpose:marketplace?sql<"rent"|"sale">`listings.listing_purpose`:sql<"rent">`'rent'::text`,
  salePriceCentavos:marketplace?sql<number|null>`CASE WHEN listings.sale_price_centavos IS NULL THEN NULL ELSE listings.sale_price_centavos::float8 END`:sql<null>`NULL::float8`,
  monthlyRentCentavos: listings.monthlyRentCentavos,
  bedrooms: listings.bedrooms, bathrooms: listings.bathrooms, rentalMode: listings.rentalMode,
  lastConfirmedAt: listings.lastConfirmedAt,
  description:listings.description,
  ownerName:sql<string>`COALESCE((SELECT COALESCE(u.preferred_name,u.display_name,'Property owner') FROM owner_profiles o JOIN users u ON u.id=o.user_id WHERE o.id=${listings.ownerId} LIMIT 1),'Property owner')`,
  ownerPhoto:sql<string|null>`(SELECT u.profile_photo FROM owner_profiles o JOIN users u ON u.id=o.user_id WHERE o.id=${listings.ownerId} LIMIT 1)`,
  latitude:process.env.ENABLE_NATIVE_AUTH==="true"||process.env.ENABLE_RENTAL_MANAGEMENT==="true"?listings.latitude:sql<null>`NULL`,
  longitude:process.env.ENABLE_NATIVE_AUTH==="true"||process.env.ENABLE_RENTAL_MANAGEMENT==="true"?listings.longitude:sql<null>`NULL`,
  photoUrls:sql<string[]>`COALESCE((SELECT json_agg(storage_key ORDER BY display_order) FROM listing_images WHERE listing_id=${listings.id} AND storage_key LIKE 'https://%'),'[]'::json)`,
  unitCounts:process.env.ENABLE_RENTAL_MANAGEMENT==="true"?sql<{total:number;available:number}>`(SELECT json_build_object('total',count(*),'available',count(*) FILTER(WHERE status='available')) FROM rental_units WHERE listing_id=${listings.id})`:sql<null>`NULL::json`,
});

export async function browsePublishedListings(filters: RentalFilters): Promise<BrowseResult> {
  const db = getDatabase();if (!db) return { state: "not_configured", listings: [] };
  const marketplace=await marketplaceSchemaReady();
  if(filters.purpose==="sale"&&!marketplace)return {state:"ready",listings:[]};
  const conditions: SQL[] = [eq(listings.status, "published"), ilike(listings.city, filters.city)];
  if (filters.type) conditions.push(eq(listings.propertyType, filters.type));
  if(marketplace&&filters.purpose)conditions.push(sql<boolean>`listings.listing_purpose=${filters.purpose}`);
  if (filters.maxRentCentavos !== undefined) {if(marketplace)conditions.push(sql<boolean>`listings.listing_purpose='rent'`);conditions.push(lte(listings.monthlyRentCentavos, filters.maxRentCentavos));}
  if (filters.minBedrooms !== undefined) conditions.push(gte(listings.bedrooms, filters.minBedrooms));
  try {const rows=await db.select(publicFields(marketplace)).from(listings).where(and(...conditions)).orderBy(desc(listings.publishedAt),desc(listings.createdAt)).limit(40);return {state:"ready",listings:rows};}
  catch(error){console.error("HomeTayo listing search failed",error instanceof Error?error.name:"UnknownError");return {state:"error",listings:[]};}
}

export async function getPublishedListing(slug: string) {
  const db=getDatabase();if(!db||!/^[a-z0-9][a-z0-9-]{0,119}$/.test(slug))return null;
  const marketplace=await marketplaceSchemaReady();
  try {const rows=await db.select({...publicFields(marketplace),description:listings.description,...(process.env.ENABLE_NATIVE_AUTH==="true"?{latitude:listings.latitude,longitude:listings.longitude}:{}),province:listings.province,furnished:listings.furnished,availableSlots:listings.availableSlots,ownerContactKind:listings.ownerContactKind,ownerContactValue:listings.ownerContactValue}).from(listings).where(and(eq(listings.slug,slug),eq(listings.status,"published"))).limit(1);return rows[0]??null;}
  catch(error){console.error("HomeTayo listing detail failed",error instanceof Error?error.name:"UnknownError");return null;}
}
export function safePublicContact(kind:string,value:string|null):string|null{
 if(!value)return null;if(kind==="phone"&&/^\+?[0-9 ()-]{7,20}$/.test(value))return "tel:"+value.replace(/[^0-9+]/g,"");
 if(kind==="messenger"){try{const url=new URL(value);if(url.protocol!=="https:"||!["m.me","messenger.com","www.messenger.com","facebook.com","www.facebook.com"].includes(url.hostname))return null;return url.toString();}catch{return null;}}
 return null;
}

export async function getLatestPublishedListings(limit=2):Promise<BrowseResult>{
 const db=getDatabase();if(!db)return {state:"not_configured",listings:[]};
 const marketplace=await marketplaceSchemaReady();const conditions:SQL[]=[eq(listings.status,"published")];if(marketplace)conditions.push(sql<boolean>`listings.listing_purpose='rent'`);
 try{const rows=await db.select(publicFields(marketplace)).from(listings).where(and(...conditions)).orderBy(desc(listings.publishedAt),desc(listings.createdAt)).limit(Math.min(Math.max(limit,1),4));return {state:"ready",listings:rows};}
 catch(error){console.error("HomeTayo featured listing lookup failed",error instanceof Error?error.name:"UnknownError");return {state:"error",listings:[]};}
}
