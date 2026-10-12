import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BedDouble, House, MapPin, SearchX } from "lucide-react";
import { SearchForm } from "@/components/search-form";
import { GuideNudge } from "@/components/guide-nudge";
import { browsePublishedListings } from "@/lib/listings";
import { formatRent, parseRentalFilters } from "@/lib/search-filters";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Explore rentals", description: "Browse approved rental listings in HomeTayo's Koronadal pilot.",
};
type Params = { city?: string | string[]; type?: string | string[]; maxRent?: string | string[]; bedrooms?: string | string[] };
function first(value: string | string[] | undefined): string {
  return typeof value === "string" ? value.slice(0, 80) : "";
}

export default async function Rentals({ searchParams }: { searchParams: Promise<Params> }) {
  const raw = await searchParams;
  const filters = parseRentalFilters(raw);
  const result = await browsePublishedListings(filters);
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
        <h1>Your next place starts here.</h1>
        <p>Search by location, price and property type. Only admin-approved properties can appear here.</p>
      </div>
      <SearchForm compact initialCity={filters.city}
        initialType={allowedTypes.includes(type) ? type : "all"}
        initialBudget={allowedBudgets.includes(budget) ? budget : ""}
        initialBedrooms={allowedRooms.includes(bedrooms) ? bedrooms : ""}/>
      <GuideNudge audience="renter" compact />
      {result.state === "ready" && result.listings.length > 0 ? (
        <section aria-label="Rental properties" className="published-results">
          <div className="results-heading"><h2>Available listings</h2><p>{result.listings.length} approved result(s) · {filters.city}</p></div>
          <div className="rental-results-grid">
            {result.listings.map((listing) => (
              <Link href={"/rentals/" + listing.slug} key={listing.id} className="rental-result-card">
                <div className="rental-card-photo"><House size={38} strokeWidth={1.25}/><span>Photos coming soon</span></div>
                <div className="rental-card-content">
                  <p className="rental-type">{listing.propertyType.replaceAll("_"," ")}</p>
                  <h3>{listing.title}</h3>
                  <p className="rental-card-location"><MapPin size={15}/> {listing.barangay}, {listing.city}</p>
                  <div className="rental-card-bottom">
                    <strong>{formatRent(listing.monthlyRentCentavos)}<small> /month</small></strong>
                    {listing.bedrooms != null && <span><BedDouble size={15}/> {listing.bedrooms} bed(s)</span>}
                  </div>
                  <p className="rental-confirmed">{listing.lastConfirmedAt
                    ? "Owner-confirmed " + new Intl.DateTimeFormat("en-PH",{dateStyle:"medium",timeZone:"Asia/Manila"}).format(listing.lastConfirmedAt)
                    : "Availability not recently confirmed"}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      ) : (
        <section className="empty-state" aria-labelledby="rental-empty-title">
          <span className="empty-icon"><SearchX size={37}/></span>
          <span className="launch-pill"><MapPin size={14}/> Koronadal pilot · Prelaunch</span>
          <h2 id="rental-empty-title">{result.state === "not_configured" ? "We're preparing the first listings."
            : result.state === "error" ? "Search is temporarily unavailable."
            : "No approved listings match yet."}</h2>
          <p>{result.state === "not_configured"
            ? "HomeTayo doesn't have published rentals yet. We won't show imaginary homes or outdated posts just to fill this page."
            : result.state === "error"
            ? "We couldn't reach the rental database right now. Please try again later."
            : "Try changing your filters or return later when more owners add verified, approved rental listings."}</p>
          <div className="empty-actions">
            <Link href="/requests/new" className="button button-primary">About rental requests <ArrowRight size={18}/></Link>
            <Link href="/owner" className="button button-outline"><House size={18}/> Own a rental?</Link>
          </div>
        </section>
      )}
    </div>
  );
}
