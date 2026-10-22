import type {Metadata} from "next";
import Link from "next/link";
import {redirect} from "next/navigation";
import {ArrowRight,BedDouble,House,SearchX,ShieldCheck,UserRound} from "lucide-react";
import {SearchForm} from "@/components/search-form";
import {GuideNudge} from "@/components/guide-nudge";
import {browsePublishedListings} from "@/lib/listings";
import {formatRent,parseRentalFilters} from "@/lib/search-filters";
import {RentalSocial} from "@/components/rental-social";
import Image from "next/image";
import {RentalSearchMap} from "@/components/rental-search-map";
import {safePhotoUrls} from "@/lib/rental-photos";
import {currentUser} from "@/lib/session-user";

export const dynamic="force-dynamic";
export const metadata:Metadata={title:"Explore rentals",description:"Browse current owner-published rental listings on HomeTayo."};
type Params={city?:string|string[];type?:string|string[];maxRent?:string|string[];bedrooms?:string|string[]};
const first=(value:string|string[]|undefined)=>typeof value==="string"?value.slice(0,80):"";
export default async function Rentals({searchParams}:{searchParams:Promise<Params>}){
 const raw=await searchParams,user=await currentUser();
 if(!user)redirect(`/sign-in?next=${encodeURIComponent("/rentals")}`);
 if(user.role==="landlord")redirect("/owner");
 const filters=parseRentalFilters({...raw,purpose:"rent"}),result=await browsePublishedListings(filters);
 const type=first(raw.type),budget=first(raw.maxRent),bedrooms=first(raw.bedrooms),allowedTypes=["all","house","apartment","boarding_house","bedspace"],allowedBudgets=["","3000","5000","8000","12000","20000"],allowedRooms=["","1","2","3","4"];
 return <div className="container interior-page">
  <div className="breadcrumb"><Link href="/">Home</Link><ArrowRight size={14}/> Explore rentals</div>
  <div className="interior-heading"><p className="section-kicker">EXPLORE HOMES</p><h1>Explore rentals</h1><p>Discover owner-published rentals, react to posts, and message owners directly.</p></div>
  <div id="rental-search"><SearchForm compact initialCity={filters.city} initialType={allowedTypes.includes(type)?type:"all"} initialBudget={allowedBudgets.includes(budget)?budget:""} initialBedrooms={allowedRooms.includes(bedrooms)?bedrooms:""}/></div>
  <GuideNudge audience="renter" compact/>
  <RentalSearchMap listings={result.listings.map(l=>({id:l.id,title:l.title,slug:l.slug,latitude:l.latitude??null,longitude:l.longitude??null,monthlyRentCentavos:l.monthlyRentCentavos}))}/>
  {result.state==="ready"&&result.listings.length>0?<section aria-label="Rental properties" className="published-results rental-social-feed"><div className="results-heading"><h2>Rental feed</h2><p>{result.listings.length} post(s) · {filters.city}</p></div><div className="rental-feed-list">
   {result.listings.map(listing=><article key={listing.id} className="rental-feed-card">
    <div className="rental-feed-owner"><span className="listing-owner-avatar">{listing.ownerPhoto?<Image src={listing.ownerPhoto} alt={`${listing.ownerName} profile`} width={46} height={46} unoptimized/>:<UserRound size={22}/>}</span><div><strong>{listing.ownerName}</strong><span>Property owner · {listing.barangay}, {listing.city}</span></div><span className="owner-status">{listing.propertyType.replaceAll("_"," ")}</span></div>
    <Link href={`/rentals/${listing.slug}`} className="rental-feed-main"><div className="rental-card-content"><h3>{listing.title}</h3><p>{listing.description}</p><div className="rental-card-bottom"><strong>{formatRent(listing.monthlyRentCentavos)}<small> /month</small></strong>{listing.bedrooms!=null&&<span><BedDouble size={15}/> {listing.bedrooms} bed(s)</span>}</div>{!!listing.unitCounts?.total&&<p className="rental-confirmed">{listing.unitCounts.available} of {listing.unitCounts.total} units available</p>}</div>
    <div className="rental-card-photo rental-feed-photo">{safePhotoUrls(listing.photoUrls)[0]?<Image src={safePhotoUrls(listing.photoUrls)[0]} alt={listing.title} width={900} height={600} unoptimized style={{width:"100%",height:"100%",objectFit:"cover"}}/>:<><House size={40} strokeWidth={1.25}/><span>No owner photos yet</span></>}</div></Link>
    {process.env.ENABLE_RENTAL_MANAGEMENT==="true"&&<div className="rental-feed-actions"><RentalSocial slug={listing.slug}/></div>}
   </article>)}
  </div></section>:<section className="empty-state" aria-labelledby="rental-empty-title"><span className="empty-icon"><SearchX size={37}/></span><span className="launch-pill"><ShieldCheck size={14}/> Owner-published rentals</span><h2 id="rental-empty-title">{result.state==="not_configured"?"We're preparing the first listings.":result.state==="error"?"Search is temporarily unavailable.":"No rentals match yet."}</h2><p>{result.state==="not_configured"?"HomeTayo doesn't have published rentals yet.":result.state==="error"?"We couldn't reach the rental database right now. Please try again later.":"Try changing your filters or return later when more owners publish rental listings."}</p><div className="empty-actions"><a href="#rental-search" className="button button-primary">Adjust your search <ArrowRight size={18}/></a><Link href="/inbox" className="button button-outline">My messages</Link></div></section>}
 </div>;
}