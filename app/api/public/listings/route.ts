import { NextResponse } from "next/server";
import { browsePublishedListings } from "@/lib/listings";
import { parseRentalFilters } from "@/lib/search-filters";

export const dynamic = "force-dynamic";

/** Public read-only JSON API for the native Android application.
 * Authentication/owner/admin actions are NOT exposed to the client.
 * Neon credentials and private owner contact information never leave the server.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const filters = parseRentalFilters({
    city:url.searchParams.get("city") || undefined,
    type:url.searchParams.get("type") || undefined,
    maxRent:url.searchParams.get("maxRent") || undefined,
    bedrooms:url.searchParams.get("bedrooms") || undefined,
  });
  const result = await browsePublishedListings(filters);
  if (result.state !== "ready") {
    return NextResponse.json(
      { state: "unavailable", listings: [], message: "Listings temporarily unavailable." },
      { status: 503, headers:{"Cache-Control":"no-store"} }
    );
  }
  return NextResponse.json({
    state: "ready",
    listings: result.listings.map(listing => ({
      slug:listing.slug,
      title:listing.title,
      propertyType:listing.propertyType,
      city:listing.city,
      barangay:listing.barangay,
      monthlyRentCentavos:listing.monthlyRentCentavos,
      bedrooms:listing.bedrooms,
      bathrooms:listing.bathrooms,
      rentalMode:listing.rentalMode,
      lastConfirmedAt:listing.lastConfirmedAt?.toISOString() ?? null,
    })),
  }, {headers:{"Cache-Control":"no-store","X-Content-Type-Options":"nosniff"}});
}
