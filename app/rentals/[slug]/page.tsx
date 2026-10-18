import Link from "next/link";
import {notFound} from "next/navigation";
import {ArrowLeft,BedDouble,Building2,MapPin,ShieldCheck,UserRound} from "lucide-react";
import {getPublishedListing} from "@/lib/listings";
import {formatRent} from "@/lib/search-filters";
import {publicUnits} from "@/lib/rental-units";
import {RentalSocial} from "@/components/rental-social";
import {ReportSafety} from "@/components/report-safety";
import Image from "next/image";
import {safePhotoUrls} from "@/lib/rental-photos";
import {currentUser} from "@/lib/session-user";

export const dynamic="force-dynamic";
export default async function ListingDetail({params}:{params:Promise<{slug:string}>}){
 const {slug}=await params;const [listing,user]=await Promise.all([getPublishedListing(slug),currentUser()]);if(!listing)notFound();
 const category=listing.propertyType.replaceAll("_"," "),units=await publicUnits(listing.id),ownerPreview=user?.role==="landlord";
 return <article className="container interior-page narrow-page">
  <Link className="back-link" href={ownerPreview?"/owner":"/rentals"}><ArrowLeft size={17}/> {ownerPreview?"Back to owner dashboard":"Back to rentals"}</Link>
  <div className="interior-heading"><p className="section-kicker">OWNER-PUBLISHED LISTING · {category.toUpperCase()}</p><h1>{listing.title}</h1><p><MapPin size={17} style={{display:"inline",verticalAlign:"middle"}}/> {listing.barangay}, {listing.city}, {listing.province}</p></div>
  <div className="info-card listing-detail">
   <div className="listing-owner-row"><span className="listing-owner-avatar">{listing.ownerPhoto?<Image src={listing.ownerPhoto} alt={`${listing.ownerName} profile`} width={52} height={52} unoptimized/>:<UserRound size={25}/>}</span><div><small>Property owner</small><strong>{listing.ownerName}</strong><span>Published this rental on HomeTayo</span></div>{user?.role==="renter"&&<ReportSafety listingId={listing.id} category="scam" label="Report owner / scam" compact/>}</div>
   {safePhotoUrls(listing.photoUrls).length?<div className="rental-photo-gallery">{safePhotoUrls(listing.photoUrls).map((url,i)=><Image key={url+i} src={url} alt={`${listing.title} · photo ${i+1}`} width={900} height={600} unoptimized style={{width:"100%",height:"auto",borderRadius:18}}/>)}</div>:<div className="detail-icon"><Building2 size={46}/><span>No owner photos provided yet</span></div>}
   <h2>{formatRent(listing.monthlyRentCentavos)} <span className="month-label">/month</span></h2><p>{listing.description}</p>
   {process.env.ENABLE_RENTAL_MANAGEMENT==="true"&&!ownerPreview&&<RentalSocial slug={listing.slug}/>} 
   {units.length>0&&<section aria-label="Room availability"><h2>{units.filter(unit=>unit.status==="available").length} of {units.length} units available</h2><div className="unit-grid">{units.map(unit=><div className={`unit-public unit-${unit.status}`} key={unit.id}><strong>{unit.label}</strong><span>{unit.status}</span><span>{formatRent(unit.monthlyRentCentavos)} / month</span></div>)}</div></section>}
   <div className="detail-facts"><span><BedDouble size={17}/> {listing.bedrooms??"Not provided"} bedrooms</span><span>{listing.bathrooms??"Not provided"} bathrooms</span><span>{listing.furnished==="unspecified"?"Furnishing not specified":"Furnishing: "+listing.furnished}</span></div>
   <div className="status-notice"><ShieldCheck size={16} style={{display:"inline"}}/> Published by the property owner; property identity, legal ownership, and physical condition are not independently guaranteed. Verify details before paying anything.</div>
   {listing.lastConfirmedAt&&<p className="rental-confirmed">Last owner-confirmed: {new Intl.DateTimeFormat("en-PH",{dateStyle:"medium",timeZone:"Asia/Manila"}).format(listing.lastConfirmedAt)}</p>}
   {process.env.ENABLE_RENTAL_MANAGEMENT!=="true"&&<p className="status-notice">HomeTayo messaging is awaiting server setup.</p>}
  </div>
 </article>;
}
