import "server-only";
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
const publicFields = {
  id: listings.id, slug: listings.slug, title: listings.title,
  propertyType: listings.propertyType, city: listings.city, barangay: listings.barangay,
  listingPurpose:sql<"rent"|"sale">`listings.listing_purpose`,
  salePriceCentavos:sql<number|null>`CASE WHEN listings.sale_price_centavos IS NULL THEN NULL ELSE listings.sale_price_centavos::float8 END`,
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
};

export async function browsePublishedListings(filters: RentalFilters): Promise<BrowseResult> {
  const db = getDatabase();if (!db) return { state: "not_configured", listings: [] };
  const conditions: SQL[] = [eq(listings.status, "published"), ilike(listings.city, filters.city)];
  if (filters.type) conditions.push(eq(listings.propertyType, filters.type));
  if(filters.purpose)conditions.push(sql<boolean>`listings.listing_purpose=${filters.purpose}`);
  if (filters.maxRentCentavos !== undefined) conditions.push(sql<boolean>`listings.listing_purpose='rent'`,lte(listings.monthlyRentCentavos, filters.maxRentCentavos));
  if (filters.minBedrooms !== undefined) conditions.push(gte(listings.bedrooms, filters.minBedrooms));
  try {const rows=await db.select(publicFields).from(listings).where(and(...conditions)).orderBy(desc(listings.publishedAt),desc(listings.createdAt)).limit(40);return {state:"ready",listings:rows};}
  catch(error){console.error("HomeTayo listing search failed",error instanceof Error?error.name:"UnknownError");return {state:"error",listings:[]};}
}

export async function getPublishedListing(slug: string) {
  const db=getDatabase();if(!db||!/^[a-z0-9][a-z0-9-]{0,119}$/.test(slug))return null;
  try {const rows=await db.select({...publicFields,description:listings.description,...(process.env.ENABLE_NATIVE_AUTH==="true"?{latitude:listings.latitude,longitude:listings.longitude}:{}),province:listings.province,furnished:listings.furnished,availableSlots:listings.availableSlots,ownerContactKind:listings.ownerContactKind,ownerContactValue:listings.ownerContactValue}).from(listings).where(and(eq(listings.slug,slug),eq(listings.status,"published"))).limit(1);return rows[0]??null;}
  catch(error){console.error("HomeTayo listing detail failed",error instanceof Error?error.name:"UnknownError");return null;}
}
export function safePublicContact(kind:string,value:string|null):string|null{
 if(!value)return null;if(kind==="phone"&&/^\+?[0-9 ()-]{7,20}$/.test(value))return "tel:"+value.replace(/[^0-9+]/g,"");
 if(kind==="messenger"){try{const url=new URL(value);if(url.protocol!=="https:"||!["m.me","messenger.com","www.messenger.com","facebook.com","www.facebook.com"].includes(url.hostname))return null;return url.toString();}catch{return null;}}
 return null;
}

export async function getLatestPublishedListings(limit=2):Promise<BrowseResult>{
 const db=getDatabase();if(!db)return {state:"not_configured",listings:[]};
 try{const rows=await db.select(publicFields).from(listings).where(eq(listings.status,"published")).orderBy(desc(listings.publishedAt),desc(listings.createdAt)).limit(Math.min(Math.max(limit,1),4));return {state:"ready",listings:rows};}
 catch(error){console.error("HomeTayo featured listing lookup failed",error instanceof Error?error.name:"UnknownError");return {state:"error",listings:[]};}
}
