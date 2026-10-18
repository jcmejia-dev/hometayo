import Link from "next/link";
import { ArrowLeft, Home, ImagePlus, ShieldCheck } from "lucide-react";
import { redirect } from "next/navigation";
import { authIsConfigured } from "@/auth";
import { currentUser } from "@/lib/session-user";
import { PropertySubmissionForm } from "@/components/property-submission-form";
import { GuideNudge } from "@/components/guide-nudge";
import {PropertyLocationPicker} from "@/components/property-location-picker";
import photoStyles from "@/components/rental-photo-upload.module.css";

export const dynamic = "force-dynamic";
export default async function NewListingPage() {
  if (!authIsConfigured()) return (
    <section className="container interior-page narrow-page">
      <Link href="/owner" className="back-link"><ArrowLeft size={17}/> Owner studio</Link>
      <div className="info-card"><h2>Sign-in setup is required.</h2><p>Property submission will become available once HomeTayo accounts are configured.</p></div>
    </section>
  );
  const account=await currentUser();
  if (!account) redirect("/sign-in");
  if(account.role!=="landlord")redirect("/profile");
  return (
    <section className="container interior-page narrow-page">
      <Link href="/owner" className="back-link"><ArrowLeft size={17}/> Owner dashboard</Link>
      <div className="interior-heading">
        <span className="page-icon"><Home size={25}/></span>
        <p className="section-kicker">ADD A RENTAL</p><h1>Tell us about your property.</h1>
        <p>Only submit genuine, authorized rental offers. Publishing makes your rental visible to renters immediately.</p>
      </div>
      <GuideNudge audience="owner" compact />
      <div className="form-howto" aria-label="Before you submit">
        <div><span>01</span><p><strong>Describe your actual rental</strong> Include its location, rent and basic facilities.</p></div>
        <div><span>02</span><p><strong>Add location & photos</strong> Choose the property pin and upload clear photos renters can trust.</p></div>
        <div><span>03</span><p><strong>Publish rental</strong> Your property appears publicly when you publish it.</p></div>
      </div>
      <PropertySubmissionForm>
        <label>Property title <input required name="title" minLength={8} maxLength={120} placeholder="e.g. Spacious 4-bedroom family house"/></label>
        <label>Description <textarea required name="description" minLength={30} maxLength={4000} rows={5} placeholder="Describe the actual space, rental terms and rules."/></label>
        <div className="form-grid">
          <label>Type <select name="propertyType" required defaultValue="house">
            <option value="house">House</option><option value="apartment">Apartment</option>
            <option value="boarding_house">Boarding house</option><option value="bedspace">Bedspace / dorm</option>
          </select></label>
          <label>Rent basis <select name="rentalMode" required defaultValue="whole_unit">
            <option value="whole_unit">Whole unit / house</option><option value="per_room">Per room</option><option value="per_bed">Per bed</option>
          </select></label>
          <label>City / municipality <input name="city" minLength={2} maxLength={80} defaultValue="Koronadal City" required/></label>
          <label>Province <input name="province" minLength={2} maxLength={80} defaultValue="South Cotabato" required/></label>
          <label>Barangay <input name="barangay" minLength={2} maxLength={80} required placeholder="e.g. Zone III"/></label>
          <label>Monthly rent (₱) <input name="monthlyRent" type="number" required min={100} max={5000000} step={1} placeholder="5000"/></label>
          <label>Bedrooms <input name="bedrooms" type="number" min={0} max={99} step={1} placeholder="Optional"/></label>
          <label>Bathrooms <input name="bathrooms" type="number" min={0} max={99} step={1} placeholder="Optional"/></label>
          <label>Available slots / beds <input name="availableSlots" type="number" min={0} max={999} step={1} placeholder="Optional"/></label>
          <label>Furnishing <select name="furnished" defaultValue="unspecified">
            <option value="unspecified">Not specified</option><option value="yes">Furnished</option>
            <option value="partial">Partially furnished</option><option value="no">Unfurnished</option>
          </select></label>
        </div>
        <PropertyLocationPicker/>
        <label className={photoStyles.picker}><span><ImagePlus size={19}/> Rental photos</span><input name="photos" type="file" accept="image/jpeg,image/png,image/webp" multiple/><small>Optional: choose up to 8 JPG, PNG, or WebP photos. Each image can be up to 4 MB. The selected photos upload automatically when you publish.</small></label>
        <p className="owner-disclaimer"><ShieldCheck size={17}/> Your listing becomes public when you publish it. You can replace its photos later from your property management page.</p>
      </PropertySubmissionForm>
    </section>
  );
}
