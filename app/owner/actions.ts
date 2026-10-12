"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { listings, ownerProfiles } from "@/db/schema";
import { getDatabase } from "@/lib/db";
import { requireAccount } from "@/lib/session-user";
import { generateSlug, propertyInputSchema, validateContact } from "@/lib/property-validation";

function stringField(form: FormData, key: string) {
  const value = form.get(key);
  return typeof value === "string" ? value : "";
}
export async function createProperty(form: FormData) {
  const account = await requireAccount();
  const parsed = propertyInputSchema.safeParse({
    title: stringField(form, "title"),
    description: stringField(form, "description"),
    propertyType: stringField(form, "propertyType"),
    rentalMode: stringField(form, "rentalMode"),
    city: stringField(form, "city"),
    barangay: stringField(form, "barangay"),
    monthlyRent: stringField(form, "monthlyRent"),
    bedrooms: stringField(form, "bedrooms"),
    bathrooms: stringField(form, "bathrooms"),
    availableSlots: stringField(form, "availableSlots"),
    furnished: stringField(form, "furnished"),
    ownerContactKind: stringField(form, "ownerContactKind"),
    ownerContactValue: stringField(form, "ownerContactValue"),
  });
  if (!parsed.success) throw new Error("Please correct your rental information and try again.");
  const value = parsed.data;
  if (!validateContact(value.ownerContactKind, value.ownerContactValue)) {
    throw new Error("Enter a valid owner-approved phone number or HTTPS Messenger link, or select none.");
  }
  const db = getDatabase();
  if (!db) throw new Error("HomeTayo's database is not configured.");
  let [profile] = await db.select({ id: ownerProfiles.id }).from(ownerProfiles)
    .where(eq(ownerProfiles.userId, account.id)).limit(1);
  if (!profile) {
    await db.insert(ownerProfiles).values({
      userId: account.id,
      publicName: (account.displayName || "Property owner").slice(0, 150),
    }).onConflictDoNothing({ target: ownerProfiles.userId });
    [profile] = await db.select({ id: ownerProfiles.id }).from(ownerProfiles)
      .where(eq(ownerProfiles.userId, account.id)).limit(1);
  }
  if (!profile) throw new Error("Could not initialize the owner profile.");

  // Listings can only enter moderation, never publish directly from this action.
  await db.insert(listings).values({
    ownerId: profile.id,
    slug: generateSlug(value.title, randomUUID().replace(/-/g, "")),
    title: value.title,
    description: value.description,
    propertyType: value.propertyType,
    rentalMode: value.rentalMode,
    status: "pending_review",
    city: value.city,
    barangay: value.barangay,
    province: "South Cotabato",
    monthlyRentCentavos: value.monthlyRent * 100,
    bedrooms: value.bedrooms === "" ? null : value.bedrooms,
    bathrooms: value.bathrooms === "" ? null : value.bathrooms,
    availableSlots: value.availableSlots === "" ? null : value.availableSlots,
    furnished: value.furnished,
    ownerContactKind: value.ownerContactKind,
    ownerContactValue: value.ownerContactKind === "none" ? null : value.ownerContactValue,
    lastConfirmedAt: new Date(),
  });
  revalidatePath("/owner");
  redirect("/owner?submitted=1");
}

export async function pauseProperty(form: FormData) {
  const account = await requireAccount();
  const id = form.get("id");
  if (typeof id !== "string" || !/^[0-9a-f-]{36}$/i.test(id)) throw new Error("Invalid listing ID.");
  const db = getDatabase();
  if (!db) throw new Error("Database not configured.");
  const [owner] = await db.select({ id: ownerProfiles.id }).from(ownerProfiles)
    .where(eq(ownerProfiles.userId, account.id)).limit(1);
  if (!owner) throw new Error("Owner profile not found.");
  await db.update(listings).set({ status: "paused", updatedAt: new Date() })
    .where(and(eq(listings.id, id), eq(listings.ownerId, owner.id), eq(listings.status, "published")));
  revalidatePath("/owner");
  revalidatePath("/rentals");
}
