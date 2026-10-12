import "server-only";
import { and, desc, eq, gte, ilike, lte, type SQL } from "drizzle-orm";
import { getDatabase } from "@/lib/db";
import { listings } from "@/db/schema";
import type { RentalFilters } from "@/lib/search-filters";

export type PublicListing = Pick<typeof listings.$inferSelect,
  "id" | "slug" | "title" | "propertyType" | "city" | "barangay"
  | "monthlyRentCentavos" | "bedrooms" | "bathrooms" | "rentalMode" | "lastConfirmedAt">;
export type BrowseResult =
  | { state: "not_configured" | "error"; listings: [] }
  | { state: "ready"; listings: PublicListing[] };
const publicFields = {
  id: listings.id, slug: listings.slug, title: listings.title,
  propertyType: listings.propertyType, city: listings.city, barangay: listings.barangay,
  monthlyRentCentavos: listings.monthlyRentCentavos,
  bedrooms: listings.bedrooms, bathrooms: listings.bathrooms, rentalMode: listings.rentalMode,
  lastConfirmedAt: listings.lastConfirmedAt,
};

export async function browsePublishedListings(filters: RentalFilters): Promise<BrowseResult> {
  const db = getDatabase();
  if (!db) return { state: "not_configured", listings: [] };
  const conditions: SQL[] = [eq(listings.status, "published"), ilike(listings.city, filters.city)];
  if (filters.type) conditions.push(eq(listings.propertyType, filters.type));
  if (filters.maxRentCentavos !== undefined) conditions.push(lte(listings.monthlyRentCentavos, filters.maxRentCentavos));
  if (filters.minBedrooms !== undefined) conditions.push(gte(listings.bedrooms, filters.minBedrooms));
  try {
    const rows = await db.select(publicFields).from(listings)
      .where(and(...conditions)).orderBy(desc(listings.publishedAt), desc(listings.createdAt)).limit(24);
    return { state: "ready", listings: rows };
  } catch (error) {
    console.error("HomeTayo listing search failed", error instanceof Error ? error.name : "UnknownError");
    return { state: "error", listings: [] };
  }
}

export async function getPublishedListing(slug: string) {
  const db = getDatabase();
  if (!db || !/^[a-z0-9][a-z0-9-]{0,119}$/.test(slug)) return null;
  try {
    const rows = await db.select({
      ...publicFields, description: listings.description,
      province: listings.province, furnished: listings.furnished,
      availableSlots: listings.availableSlots, ownerContactKind: listings.ownerContactKind,
      ownerContactValue: listings.ownerContactValue,
    }).from(listings).where(and(eq(listings.slug, slug), eq(listings.status, "published"))).limit(1);
    return rows[0] ?? null;
  } catch (error) {
    console.error("HomeTayo listing detail failed", error instanceof Error ? error.name : "UnknownError");
    return null;
  }
}
export function safePublicContact(kind: string, value: string | null): string | null {
  if (!value) return null;
  if (kind === "phone" && /^\+?[0-9 ()-]{7,20}$/.test(value)) return "tel:" + value.replace(/[^0-9+]/g, "");
  if (kind === "messenger") {
    try {
      const url = new URL(value);
      if (url.protocol !== "https:" || !["m.me", "messenger.com", "www.messenger.com", "facebook.com", "www.facebook.com"].includes(url.hostname)) return null;
      return url.toString();
    } catch { return null; }
  }
  return null;
}
