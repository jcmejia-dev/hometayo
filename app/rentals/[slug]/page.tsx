import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, BedDouble, Building2, ExternalLink, MapPin, ShieldCheck } from "lucide-react";
import { getPublishedListing, safePublicContact } from "@/lib/listings";
import { formatRent } from "@/lib/search-filters";
import { publicUnits } from "@/lib/rental-units";
import { RentalSocial } from "@/components/rental-social";
import Image from "next/image";
import {safePhotoUrls} from "@/lib/rental-photos";

export const dynamic = "force-dynamic";
export default async function ListingDetail({ params }: { params: Promise<{slug: string}> }) {
  const {slug} = await params;
  const listing = await getPublishedListing(slug);
  if (!listing) notFound();
  const contact = safePublicContact(listing.ownerContactKind, listing.ownerContactValue);
  const category = listing.propertyType.replaceAll("_", " ");
  const units = await publicUnits(listing.id);
  return (
    <article className="container interior-page narrow-page">
      <Link className="back-link" href="/rentals"><ArrowLeft size={17}/> Back to rentals</Link>
      <div className="interior-heading">
        <p className="section-kicker">APPROVED OWNER LISTING · {category.toUpperCase()}</p>
        <h1>{listing.title}</h1>
        <p><MapPin size={17} style={{display:"inline",verticalAlign:"middle"}}/> {listing.barangay}, {listing.city}, {listing.province}</p>
      </div>
      <div className="info-card listing-detail">
        {safePhotoUrls(listing.photoUrls).length?<div className="rental-photo-gallery">{safePhotoUrls(listing.photoUrls).map((url,i)=><Image key={url+i} src={url} alt={`${listing.title} · photo ${i+1}`} width={900} height={600} unoptimized style={{width:"100%",height:"auto",borderRadius:18}}/>)}</div>:<div className="detail-icon"><Building2 size={46}/><span>No owner photos provided yet</span></div>}
        <h2>{formatRent(listing.monthlyRentCentavos)} <span className="month-label">/month</span></h2>
        <p>{listing.description}</p>
        {process.env.ENABLE_RENTAL_MANAGEMENT === "true" && <RentalSocial slug={listing.slug}/>}
        {units.length > 0 && <section aria-label="Room availability">
          <h2>{units.filter(unit => unit.status === "available").length} of {units.length} units available</h2>
          <div className="unit-grid">{units.map(unit => <div className={`unit-public unit-${unit.status}`} key={unit.id}>
            <strong>{unit.label}</strong><span>{unit.status}</span><span>{formatRent(unit.monthlyRentCentavos)} / month</span>
          </div>)}</div>
        </section>}
        <div className="detail-facts">
          <span><BedDouble size={17}/> {listing.bedrooms ?? "Not provided"} bedrooms</span>
          <span>{listing.bathrooms ?? "Not provided"} bathrooms</span>
          <span>{listing.furnished === "unspecified" ? "Furnishing not specified" : "Furnishing: " + listing.furnished}</span>
        </div>
        <div className="status-notice"><ShieldCheck size={16} style={{display:"inline"}}/> Listing approved for publication; property identity, legal ownership, and physical condition are not independently guaranteed. Verify details before paying anything.</div>
        {listing.lastConfirmedAt && <p className="rental-confirmed">Last owner-confirmed: {new Intl.DateTimeFormat("en-PH",{dateStyle:"medium",timeZone:"Asia/Manila"}).format(listing.lastConfirmedAt)}</p>}
        {contact && <a className="button button-primary detail-contact" href={contact} target={contact.startsWith("https:")?"_blank":undefined} rel="noopener noreferrer">
          Contact owner <ExternalLink size={17}/>
        </a>}
        {!contact && <p className="status-notice">No owner-approved contact method is published for this listing yet.</p>}
      </div>
    </article>
  );
}
