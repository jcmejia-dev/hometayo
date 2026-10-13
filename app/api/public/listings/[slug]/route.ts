import { NextResponse } from "next/server";
import { getPublishedListing, safePublicContact } from "@/lib/listings";

/** Details for one genuinely published rental. No internal owner IDs or admin fields. */
export const dynamic = "force-dynamic";
export async function GET(_request:Request, {params}:{params:Promise<{slug:string}>}) {
  const {slug}=await params;
  const listing=await getPublishedListing(slug);
  if (!listing) return NextResponse.json({message:"Listing not found"},{
    status:404,headers:{"Cache-Control":"no-store"},
  });
  return NextResponse.json({
    slug:listing.slug,
    title:listing.title,
    description:listing.description,
    propertyType:listing.propertyType,
    rentalMode:listing.rentalMode,
    city:listing.city,
    barangay:listing.barangay,
    province:listing.province,
    monthlyRentCentavos:listing.monthlyRentCentavos,
    bedrooms:listing.bedrooms,
    bathrooms:listing.bathrooms,
    furnished:listing.furnished,
    availableSlots:listing.availableSlots,
    lastConfirmedAt:listing.lastConfirmedAt?.toISOString() ?? null,
    // Contact methods are user-supplied PUBLIC listing details, but must be safe URL schemes.
    contactUrl:safePublicContact(listing.ownerContactKind,listing.ownerContactValue),
  },{headers:{"Cache-Control":"no-store","X-Content-Type-Options":"nosniff"}});
}
