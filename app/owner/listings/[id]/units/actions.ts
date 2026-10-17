"use server";
import { revalidatePath } from "next/cache";
import { requireAccount } from "@/lib/session-user";
import { saveUnit } from "@/lib/rental-units";
import {neon} from "@neondatabase/serverless";
import {redirect} from "next/navigation";
import {UPDATE_OWNER_PIN} from "@/lib/native-listing-policy";
import {uuidInput} from "@/lib/rental-unit-input";
import {readPropertyPin} from "@/lib/property-location-input";

export async function updateAvailability(form: FormData) {
  const user = await requireAccount();
  if (user.role !== "landlord") throw new Error("An owner account is required.");
  const listingId = String(form.get("listingId") || "");
  await saveUnit(listingId, user.id, {
    label: form.get("label"), status: form.get("status"), monthlyRent: form.get("monthlyRent"),
  }, String(form.get("unitId") || "") || undefined);
  revalidatePath(`/owner/listings/${listingId}/units`);
  revalidatePath("/owner");
  revalidatePath("/rentals", "layout");
}

export async function updatePropertyLocation(form:FormData){
 const user=await requireAccount();if(user.role!=="landlord")throw Error("A property-owner account is required.");
 if(!process.env.DATABASE_URL||process.env.ENABLE_RENTAL_MANAGEMENT!=="true")throw Error("Property management is awaiting setup.");
 const id=uuidInput.parse(form.get("listingId"));
 const point=readPropertyPin(String(form.get("latitude")||""),String(form.get("longitude")||""));
 if(point&&form.get("locationConfirmed")!=="yes")throw Error("Confirm that this pin marks the property.");
 const rows=await neon(process.env.DATABASE_URL).query(UPDATE_OWNER_PIN,[point?.latitude??null,point?.longitude??null,user.id,id]);
 if(!rows.length)throw Error("Property not found or access denied.");
 revalidatePath("/owner");revalidatePath("/rentals","layout");revalidatePath(`/owner/listings/${id}/units`);
 redirect(`/owner/listings/${id}/units?locationSaved=1`);
}
