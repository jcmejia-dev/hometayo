import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, BedDouble, Building2, ExternalLink, MapPin, ShieldCheck } from "lucide-react";
import { getPublishedListing, safePublicContact } from "@/lib/listings";
import { formatRent } from "@/lib/search-filters";

export const dynamic = "force-dynamic";
export default async function ListingDetail({ params }: { params: Promise<{slug: string}> }) {
  const {slug} = await params;
  const listing = await getPublishedListing(slug);
  if (!listing) notFound();
  const contact = safePublicContact(listing.ownerContactKind, listing.ownerContactValue);
  const category = listing.propertyType.replaceAll("_", " ");
  return (
    <article className="container interior-page narrow-page">
      <Link className="back-link" href="/rentals"><ArrowLeft size={17}/> Back to rentals</Link>
      <div className="interior-heading">
        <p className="section-kicker">APPROVED OWNER LISTING · {category.toUpperCase()}</p>
        <h1>{listing.title}</h1>
        <p><MapPin size={17} style={{display:"inline",verticalAlign:"middle"}}/> {listing.barangay}, {listing.city}, {listing.province}</p>
      </div>
      <div className="info-card listing-detail">
        <div className="detail-icon"><Building2 size={46}/><span>Owner photos are not yet supported</span></div>
        <h2>{formatRent(listing.monthlyRentCentavos)} <span className="month-label">/month</span></h2>
        <p>{listing.description}</p>
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
