import { NextResponse } from "next/server";
import { getPublishedListing, safePublicContact } from "@/lib/listings";
import { publicUnits } from "@/lib/rental-units";
import {safePhotoUrls} from "@/lib/rental-photos";

/** Details for one genuinely published rental. */
export const dynamic = "force-dynamic";
export async function GET(_request:Request, {params}:{params:Promise<{slug:string}>}) {
  const {slug}=await params;
  const listing=await getPublishedListing(slug);
  if (!listing) return NextResponse.json({message:"Listing not found"},{
    status:404,headers:{"Cache-Control":"no-store"},
  });
  return NextResponse.json({
    units:await publicUnits(listing.id),
    photoUrls:safePhotoUrls(listing.photoUrls),
    slug:listing.slug,
    title:listing.title,
    description:listing.description,
    propertyType:listing.propertyType,
    rentalMode:listing.rentalMode,
    city:listing.city,
    barangay:listing.barangay,
    latitude:listing.latitude ?? null,longitude:listing.longitude ?? null,
    province:listing.province,
    monthlyRentCentavos:listing.monthlyRentCentavos,
    bedrooms:listing.bedrooms,
    bathrooms:listing.bathrooms,
    furnished:listing.furnished,
    availableSlots:listing.availableSlots,
    lastConfirmedAt:listing.lastConfirmedAt?.toISOString() ?? null,
    ownerName:listing.ownerName,
    ownerPhoto:listing.ownerPhoto,
    contactUrl:safePublicContact(listing.ownerContactKind,listing.ownerContactValue),
  },{headers:{"Cache-Control":"no-store","X-Content-Type-Options":"nosniff"}});
}
