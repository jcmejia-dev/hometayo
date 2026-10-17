"use server";
import { revalidatePath } from "next/cache";
import { requireAccount } from "@/lib/session-user";
import { saveUnit } from "@/lib/rental-units";

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
