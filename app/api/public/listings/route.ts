import { NextResponse } from "next/server";
import { browsePublishedListings } from "@/lib/listings";
import { parseRentalFilters } from "@/lib/search-filters";
import { browseMapRentals } from "@/lib/geo-listings";

export const dynamic = "force-dynamic";

/** Public read-only JSON API for the native Android application.
 * Authentication/owner/admin actions are NOT exposed to the client.
 * Neon credentials and private owner contact information never leave the server.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  if(url.searchParams.get("map")==="1") {
    try {return NextResponse.json(await browseMapRentals(url),{headers:{"Cache-Control":"no-store"}});}
    catch(error) {const bad=error instanceof Error && error.message.startsWith("Invalid");return NextResponse.json({message:bad?error.message:"Map listings temporarily unavailable.",listings:[]},{status:bad?400:503,headers:{"Cache-Control":"no-store"}});}
  }
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
