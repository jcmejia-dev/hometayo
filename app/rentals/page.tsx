import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, House, MapPin, SearchX } from "lucide-react";
import { SearchForm } from "@/components/search-form";

export const metadata: Metadata = { title: "Explore rentals", description: "Find rental homes and boarding houses in the HomeTayo pilot." };

type Params = { city?: string | string[]; type?: string | string[]; maxRent?: string | string[]; bedrooms?: string | string[] };
function first(value: string | string[] | undefined): string {
  return typeof value === "string" ? value.slice(0, 80) : "";
}

export default async function Rentals({ searchParams }: { searchParams: Promise<Params> }) {
  const params = await searchParams;
  const city = first(params.city) || "Koronadal City";
  const type = first(params.type);
  const budget = first(params.maxRent);
  const bedrooms = first(params.bedrooms);
  const allowedTypes = ["all", "house", "apartment", "boarding_house", "bedspace"];
  const allowedBudget = ["", "3000", "5000", "8000", "12000", "20000"];
  const allowedRooms = ["", "1", "2", "3", "4"];
  return (
    <div className="container interior-page">
      <div className="breadcrumb"><Link href="/">Home</Link><ArrowRight size={14} /> Explore rentals</div>
      <div className="interior-heading"><p className="section-kicker">EXPLORE HOMES</p><h1>Your next place starts here.</h1><p>Make your search your own. Real listings are coming as local owners join.</p></div>
      <SearchForm compact initialCity={city} initialType={allowedTypes.includes(type) ? type : "all"} initialBudget={allowedBudget.includes(budget) ? budget : ""} initialBedrooms={allowedRooms.includes(bedrooms) ? bedrooms : ""} />
      <section className="empty-state" aria-labelledby="rental-empty-title">
        <span className="empty-icon"><SearchX size={37} /></span>
        <span className="launch-pill"><MapPin size={14} /> Koronadal pilot · Prelaunch</span>
        <h2 id="rental-empty-title">We&apos;re preparing the first listings.</h2>
        <p>HomeTayo doesn&apos;t have published rentals yet. We won&apos;t show imaginary homes or outdated posts just to fill this page.</p>
        <div className="empty-actions"><Link href="/requests/new" className="button button-primary">About rental requests <ArrowRight size={18} /></Link><Link href="/owner" className="button button-outline"><House size={18} /> Own a rental?</Link></div>
      </section>
    </div>
  );
}
