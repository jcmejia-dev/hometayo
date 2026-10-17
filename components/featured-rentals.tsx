import Link from "next/link";
import { ArrowRight, BedDouble, House, MapPin, ShieldCheck } from "lucide-react";
import type { BrowseResult } from "@/lib/listings";
import { formatRent } from "@/lib/search-filters";

/**
 * Real HomeTayo rental discovery panel. Only approved database records are
 * presented as listings; when empty/unavailable, show useful honest actions.
 */
export function FeaturedRentalsPanel({ result,audience }: { result: BrowseResult;audience?:"renter" }) {
  const listings = result.listings;
  return (
    <aside className="market-preview-wrap featured-wrap" aria-labelledby="featured-rentals-heading">
      <div className="featured-panel">
        <div className="featured-panel-header">
          <span className="featured-label"><ShieldCheck size={15} aria-hidden="true"/> Admin-approved listings</span>
          <h2 id="featured-rentals-heading">Recently added rentals</h2>
          <p>Browse local places with clear rental details.</p>
        </div>
        {listings.length ? (
          <div className="featured-list">
            {listings.map((listing) => (
              <Link className="featured-listing" href={"/rentals/" + listing.slug} key={listing.id}>
                <span className="featured-listing-icon" aria-hidden="true"><House size={23}/></span>
                <span className="featured-listing-info">
                  <span className="featured-listing-type">{listing.propertyType.replaceAll("_", " ")}</span>
                  <strong>{listing.title}</strong>
                  <small><MapPin size={12} aria-hidden="true"/> {listing.barangay}, {listing.city}</small>
                  {listing.bedrooms != null && <small><BedDouble size={12} aria-hidden="true"/> {listing.bedrooms} bedroom(s)</small>}
                </span>
                <span className="featured-listing-price">{formatRent(listing.monthlyRentCentavos)}<small>/month</small></span>
              </Link>
            ))}
          </div>
        ) : (
          <div className="featured-empty">
            <span className="featured-empty-mark" aria-hidden="true"><House size={37} strokeWidth={1.5}/></span>
            <h3>Find a place that feels right.</h3>
            <p>{result.state === "error"
              ? "Rental listings are temporarily unavailable. Please try again shortly."
              : "New rentals will appear here after property owners submit them and an administrator approves them."}</p>
          </div>
        )}
        <div className="featured-panel-actions">
          <Link href="/rentals" className="button button-primary">Explore rentals <ArrowRight size={16} aria-hidden="true"/></Link>
          {audience!=="renter"&&<Link href="/owner" className="featured-secondary-link">List a property <ArrowRight size={15} aria-hidden="true"/></Link>}
        </div>
      </div>
      <p className="featured-disclaimer">Listings are reviewed before publication. Always verify property details independently.</p>
    </aside>
  );
}
