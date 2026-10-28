import Link from "next/link";
import {notFound} from "next/navigation";
import {and,asc,eq} from "drizzle-orm";
import {ArrowLeft,Save} from "lucide-react";
import {listingImages,listings,ownerProfiles} from "@/db/schema";
import {OwnerPhotoForm} from "@/components/owner-photo-form";
import {getDatabase} from "@/lib/db";
import {requireAccount} from "@/lib/session-user";
import {uuidInput} from "@/lib/rental-unit-input";
import {updatePropertyDetails} from "../../../actions";

export const dynamic="force-dynamic";
export default async function EditListingPage({params}:{params:Promise<{id:string}>}){
 const user=await requireAccount();const {id}=await params;if(user.role!=="landlord"||!uuidInput.safeParse(id).success)notFound();
 const db=getDatabase();if(!db)notFound();
 const [listing]=await db.select({id:listings.id,title:listings.title,description:listings.description,propertyType:listings.propertyType,rentalMode:listings.rentalMode,city:listings.city,province:listings.province,barangay:listings.barangay,monthlyRentCentavos:listings.monthlyRentCentavos,bedrooms:listings.bedrooms,bathrooms:listings.bathrooms,availableSlots:listings.availableSlots,furnished:listings.furnished,status:listings.status})
  .from(listings).innerJoin(ownerProfiles,eq(ownerProfiles.id,listings.ownerId)).where(and(eq(listings.id,id),eq(ownerProfiles.userId,user.id))).limit(1);
 if(!listing||["removed","rejected"].includes(listing.status))notFound();
 const photoRows=process.env.ENABLE_RENTAL_MANAGEMENT==="true"
  ?await db.select({url:listingImages.storageKey}).from(listingImages).where(eq(listingImages.listingId,id)).orderBy(asc(listingImages.displayOrder))
  :[];
 return <section className="container interior-page narrow-page">
  <Link className="back-link" href="/owner"><ArrowLeft size={17}/> Owner dashboard</Link>
  <div className="interior-heading"><p className="section-kicker">EDIT RENTAL</p><h1>Edit your posting.</h1><p>Update the details renters see, then add, replace, or remove the property photos below. Rooms and location remain managed separately.</p></div>
  <form action={updatePropertyDetails} className="owner-form info-card">
   <input type="hidden" name="id" value={listing.id}/><input type="hidden" name="latitude" value=""/><input type="hidden" name="longitude" value=""/>
   <label>Property title<input required name="title" minLength={8} maxLength={120} defaultValue={listing.title}/></label>
   <label>Description<textarea required name="description" minLength={30} maxLength={4000} rows={6} defaultValue={listing.description}/></label>
   <div className="form-grid">
    <label>Type<select name="propertyType" required defaultValue={listing.propertyType}><option value="house">House</option><option value="apartment">Apartment</option><option value="boarding_house">Boarding house</option><option value="bedspace">Bedspace / dorm</option></select></label>
    <label>Rent basis<select name="rentalMode" required defaultValue={listing.rentalMode}><option value="whole_unit">Whole unit / house</option><option value="per_room">Per room</option><option value="per_bed">Per bed</option></select></label>
    <label>City / municipality<input name="city" minLength={2} maxLength={80} required defaultValue={listing.city}/></label>
    <label>Province<input name="province" minLength={2} maxLength={80} required defaultValue={listing.province}/></label>
    <label>Barangay<input name="barangay" minLength={2} maxLength={80} required defaultValue={listing.barangay}/></label>
    <label>Monthly rent (₱)<input name="monthlyRent" type="number" required min={100} max={5000000} step={1} defaultValue={listing.monthlyRentCentavos/100}/></label>
    <label>Bedrooms<input name="bedrooms" type="number" min={0} max={99} step={1} defaultValue={listing.bedrooms??""}/></label>
    <label>Bathrooms<input name="bathrooms" type="number" min={0} max={99} step={1} defaultValue={listing.bathrooms??""}/></label>
    <label>Available slots / beds<input name="availableSlots" type="number" min={0} max={999} step={1} defaultValue={listing.availableSlots??""}/></label>
    <label>Furnishing<select name="furnished" defaultValue={listing.furnished}><option value="unspecified">Not specified</option><option value="yes">Furnished</option><option value="partial">Partially furnished</option><option value="no">Unfurnished</option></select></label>
   </div>
   <div className="owner-actions"><button className="button button-primary" type="submit"><Save size={17}/>Save changes</button><Link className="button button-outline" href={`/owner/listings/${id}/units`}>Rooms & location</Link></div>
  </form>
  {process.env.ENABLE_RENTAL_MANAGEMENT==="true"
   ?<OwnerPhotoForm listingId={id} existingUrls={photoRows.map(row=>row.url)}/>
   :<div className="info-card unit-card"><h2>Property photos</h2><p>Photo management is awaiting rental-management database setup.</p></div>}
 </section>;
}
