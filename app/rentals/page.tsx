import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BedDouble, House, MapPin, SearchX, ShieldCheck } from "lucide-react";
import { SearchForm } from "@/components/search-form";
import { GuideNudge } from "@/components/guide-nudge";
import { browsePublishedListings } from "@/lib/listings";
import { formatRent, parseRentalFilters } from "@/lib/search-filters";
import { RentalSocial } from "@/components/rental-social";
import Image from "next/image";
import {safePhotoUrls} from "@/lib/rental-photos";
import {currentUser} from "@/lib/session-user";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Explore rentals", description: "Browse current owner-published rental listings on HomeTayo.",
};
type Params = { city?: string | string[]; type?: string | string[]; maxRent?: string | string[]; bedrooms?: string | string[] };
function first(value: string | string[] | undefined): string {
  return typeof value === "string" ? value.slice(0, 80) : "";
}

export default async function Rentals({ searchParams }: { searchParams: Promise<Params> }) {
  const raw = await searchParams;
  const filters = parseRentalFilters(raw);
  const [result,user] = await Promise.all([browsePublishedListings(filters),currentUser()]);
  const type = first(raw.type);
  const budget = first(raw.maxRent);
  const bedrooms = first(raw.bedrooms);
  const allowedTypes = ["all","house","apartment","boarding_house","bedspace"];
  const allowedBudgets = ["","3000","5000","8000","12000","20000"];
  const allowedRooms = ["","1","2","3","4"];

  return (
    <div className="container interior-page">
      <div className="breadcrumb"><Link href="/">Home</Link><ArrowRight size={14}/> Explore rentals</div>
      <div className="interior-heading">
        <p className="section-kicker">EXPLORE HOMES</p>
        <h1>Explore rentals</h1>
        <p>Filter published rentals by location, price and type.</p>
      </div>
      <div id="rental-search"><SearchForm compact initialCity={filters.city}
        initialType={allowedTypes.includes(type) ? type : "all"}
        initialBudget={allowedBudgets.includes(budget) ? budget : ""}
        initialBedrooms={allowedRooms.includes(bedrooms) ? bedrooms : ""}/></div>
      <GuideNudge audience="renter" compact />
      {result.state === "ready" && result.listings.length > 0 ? (
        <section aria-label="Rental properties" className="published-results">
          <div className="results-heading"><h2>Rental posts</h2><p>{result.listings.length} result(s) · {filters.city}</p></div>
          <div className="rental-results-grid">
            {result.listings.map((listing) => (
              <article key={listing.id} className="rental-result-card">
                <Link href={"/rentals/" + listing.slug}>
                <div className="rental-card-photo">{safePhotoUrls(listing.photoUrls)[0]?<Image src={safePhotoUrls(listing.photoUrls)[0]} alt={listing.title} width={640} height={400} unoptimized style={{width:"100%",height:"100%",objectFit:"cover"}}/>:<><House size={38} strokeWidth={1.25}/><span>No owner photos yet</span></>}</div>
                <div className="rental-card-content">
                  <p className="rental-type">{listing.propertyType.replaceAll("_"," ")}</p>
                  <h3>{listing.title}</h3>
                  <p className="rental-card-location"><MapPin size={15}/> {listing.barangay}, {listing.city}</p>
                  <p>{listing.description.slice(0,180)}{listing.description.length>180?"…":""}</p>
                  {!!listing.unitCounts?.total&&<p className="rental-confirmed">{listing.unitCounts.available} of {listing.unitCounts.total} units available{listing.unitCounts.available===0?" · Currently full":""}</p>}
                  <div className="rental-card-bottom">
                    <strong>{formatRent(listing.monthlyRentCentavos)}<small> /month</small></strong>
                    {listing.bedrooms != null && <span><BedDouble size={15}/> {listing.bedrooms} bed(s)</span>}
                  </div>
                  <p className="rental-confirmed">{listing.lastConfirmedAt
                    ? "Owner-confirmed " + new Intl.DateTimeFormat("en-PH",{dateStyle:"medium",timeZone:"Asia/Manila"}).format(listing.lastConfirmedAt)
                    : "Availability not recently confirmed"}</p>
                </div>
                </Link>
                {process.env.ENABLE_RENTAL_MANAGEMENT === "true" && <div className="rental-card-content"><RentalSocial slug={listing.slug}/></div>}
              </article>
            ))}
          </div>
        </section>
      ) : (
        <section className="empty-state" aria-labelledby="rental-empty-title">
          <span className="empty-icon"><SearchX size={37}/></span>
          <span className="launch-pill"><ShieldCheck size={14}/> Owner-published rentals</span>
          <h2 id="rental-empty-title">{result.state === "not_configured" ? "We're preparing the first listings."
            : result.state === "error" ? "Search is temporarily unavailable."
            : "No rentals match yet."}</h2>
          <p>{result.state === "not_configured"
            ? "HomeTayo doesn't have published rentals yet. We won't show imaginary homes or outdated posts just to fill this page."
            : result.state === "error"
            ? "We couldn't reach the rental database right now. Please try again later."
            : "Try changing your filters or return later when more owners publish rental listings."}</p>
          <div className="empty-actions">
            {user?.role==="renter"?<><a href="#rental-search" className="button button-primary">Adjust your search <ArrowRight size={18}/></a><Link href="/inbox" className="button button-outline">My messages</Link></>:<><Link href="/requests/new" className="button button-primary">About rental requests <ArrowRight size={18}/></Link><Link href="/owner" className="button button-outline"><House size={18}/> Own a rental?</Link></>}
          </div>
        </section>
      )}
    </div>
  );
}
