import Link from "next/link";
import { notFound } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { listings, ownerProfiles } from "@/db/schema";
import { requireAccount } from "@/lib/session-user";
import { getDatabase } from "@/lib/db";
import { ownedUnits } from "@/lib/rental-units";
import { uuidInput, unitStatuses } from "@/lib/rental-unit-input";
import { updateAvailability,updatePropertyLocation } from "./actions";
import {OwnerPhotoForm} from "@/components/owner-photo-form";
import {PropertyLocationPicker} from "@/components/property-location-picker";

export const dynamic = "force-dynamic";
export default async function UnitsPage({ params,searchParams }: { params: Promise<{ id: string }>;searchParams:Promise<{locationSaved?:string}> }) {
  const user = await requireAccount();
  const { id } = await params;
  if (user.role !== "landlord" || !uuidInput.safeParse(id).success) notFound();
  const db = getDatabase();
  if (!db) notFound();
  const [listing] = await db.select({ title: listings.title, rentalMode: listings.rentalMode, rent: listings.monthlyRentCentavos,...(process.env.ENABLE_RENTAL_MANAGEMENT==="true"?{latitude:listings.latitude,longitude:listings.longitude}:{}) })
    .from(listings).innerJoin(ownerProfiles, eq(ownerProfiles.id, listings.ownerId))
    .where(and(eq(listings.id, id), eq(ownerProfiles.userId, user.id))).limit(1);
  if (!listing) notFound();
  if (process.env.ENABLE_RENTAL_MANAGEMENT !== "true") return <section className="container interior-page narrow-page"><h1>Room availability</h1><p>Room management is awaiting database setup.</p><Link href="/owner">Back to your properties</Link></section>;
  const units = await ownedUnits(id, user.id);
  const feedback=await searchParams;
  return <section className="container interior-page narrow-page">
    <Link className="back-link" href="/owner">← Your properties</Link>
    <div className="interior-heading"><p className="section-kicker">ROOMS & AVAILABILITY</p><h1>{listing.title}</h1><p>Organize each room, bed, or rental unit. These labels and availability statuses are public when your listing is published.</p></div>
    {feedback.locationSaved==="1"&&<p role="status" className="status-notice">Property location updated.</p>}
    <form className="owner-form info-card" action={updatePropertyLocation}><input type="hidden" name="listingId" value={id}/><PropertyLocationPicker key={`${listing.latitude},${listing.longitude}`} initialPoint={typeof listing.latitude==="number"&&typeof listing.longitude==="number"?{latitude:listing.latitude,longitude:listing.longitude}:null}/><p>Location changes update the listing without changing its publication status.</p><button className="button button-outline">Save location</button></form>
    <div className="owner-quick-stats"><span><strong>{units.length}</strong> Total units</span><span><strong>{units.filter(u => u.status === "available").length}</strong> Available</span><span><strong>{units.filter(u => u.status === "occupied").length}</strong> Occupied</span></div>
    <div className="unit-grid">{units.map(unit => <form action={updateAvailability} className={`info-card unit-card unit-${unit.status}`} key={unit.id}>
      <input type="hidden" name="listingId" value={id}/><input type="hidden" name="unitId" value={unit.id}/>
      <label>Room or unit label<input name="label" required maxLength={60} defaultValue={unit.label}/></label>
      <label>Monthly rent (₱)<input name="monthlyRent" type="number" min="1" max="5000000" step="0.01" required defaultValue={(unit.monthlyRentCentavos / 100).toFixed(2)}/></label>
      <label>Availability<select name="status" defaultValue={unit.status}>{unitStatuses.map(s => <option key={s} value={s}>{s}</option>)}</select></label>
      <button className="button button-outline">Save availability</button>
    </form>)}</div>
    <form action={updateAvailability} className="info-card unit-card">
      <h2>Add a room, bed, or unit</h2><p>Use neutral labels such as Room 1. Do not enter a tenant’s name.</p>
      <input type="hidden" name="listingId" value={id}/><input type="hidden" name="status" value="available"/>
      <label>Label<input name="label" required maxLength={60} placeholder={listing.rentalMode === "whole_unit" ? "Whole property" : "Room 1"}/></label>
      <label>Monthly rent (₱)<input name="monthlyRent" type="number" required min="1" max="5000000" step="0.01" defaultValue={(listing.rent / 100).toFixed(2)}/></label>
      <button className="button button-primary">Add available unit</button>
    </form>
    <OwnerPhotoForm listingId={id}/>
  </section>;
}
