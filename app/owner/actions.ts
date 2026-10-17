"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { eq, sql } from "drizzle-orm";
import { ownerProfiles } from "@/db/schema";
import { getDatabase } from "@/lib/db";
import { requireAccount } from "@/lib/session-user";
import { generateSlug, propertyInputSchema } from "@/lib/property-validation";

function stringField(form: FormData, key: string) {
  const value = form.get(key);
  return typeof value === "string" ? value : "";
}
export async function createProperty(form: FormData) {
  const account = await requireAccount();
  if(account.role!=="landlord")throw new Error("A property-owner account is required.");
  const parsed = propertyInputSchema.safeParse({
    title: stringField(form, "title"),
    description: stringField(form, "description"),
    propertyType: stringField(form, "propertyType"),
    rentalMode: stringField(form, "rentalMode"),
    city: stringField(form, "city"),
    province: stringField(form,"province") || "South Cotabato",
    barangay: stringField(form, "barangay"),
    latitude: stringField(form,"latitude"),
    longitude: stringField(form,"longitude"),
    monthlyRent: stringField(form, "monthlyRent"),
    bedrooms: stringField(form, "bedrooms"),
    bathrooms: stringField(form, "bathrooms"),
    availableSlots: stringField(form, "availableSlots"),
    furnished: stringField(form, "furnished"),
    ownerContactKind: "none",
    ownerContactValue: "",
  });
  if (!parsed.success) throw new Error("Please correct your rental information and try again.");
  const value = parsed.data;
  const locationsReady=process.env.ENABLE_NATIVE_AUTH==="true"||process.env.ENABLE_RENTAL_MANAGEMENT==="true";
  if(!locationsReady && value.latitude!==null)throw new Error("Property map pins are awaiting backend setup.");
  const coordinateColumns=locationsReady?sql`, latitude, longitude`:sql``;
  const coordinateValues=locationsReady?sql`, ${value.latitude}, ${value.longitude}`:sql``;
  if(value.latitude!==null&&stringField(form,"locationConfirmed")!=="yes")throw new Error("Confirm that the selected pin marks the property.");
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

  // Create listing and its operational event together in one SQL statement.
  const newId = randomUUID();
  await db.execute(sql`
    WITH created AS (
      INSERT INTO listings (
        id, owner_id, slug, title, description, property_type, rental_mode, status,
        city, barangay, province${coordinateColumns}, monthly_rent_centavos, bedrooms, bathrooms,
        available_slots, furnished, owner_contact_kind, owner_contact_value, last_confirmed_at
      ) VALUES (
        ${newId}::uuid, ${profile.id}::uuid, ${generateSlug(value.title, newId.replace(/-/g, ""))},
        ${value.title}, ${value.description}, ${value.propertyType}, ${value.rentalMode},
        'pending_review', ${value.city}, ${value.barangay}, ${value.province}${coordinateValues},
        ${value.monthlyRent * 100}, ${value.bedrooms === "" ? null : value.bedrooms},
        ${value.bathrooms === "" ? null : value.bathrooms},
        ${value.availableSlots === "" ? null : value.availableSlots}, ${value.furnished},
        ${value.ownerContactKind}, ${value.ownerContactKind === "none" ? null : value.ownerContactValue},
        now()
      ) RETURNING id
    )
    INSERT INTO platform_events (actor_user_id, kind, listing_id)
    SELECT ${account.id}, 'listing.submitted', id FROM created
  `);
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
  // The ownership condition is evaluated in SQL. No other user's listing can be changed.
  await db.execute(sql`
    WITH paused AS (
      UPDATE listings SET status = 'paused', updated_at = now()
      WHERE id = ${id}::uuid AND owner_id = ${owner.id}::uuid AND status = 'published'
      RETURNING id
    )
    INSERT INTO platform_events (actor_user_id, kind, listing_id)
    SELECT ${account.id}, 'listing.paused', id FROM paused
  `);
  revalidatePath("/owner");
  revalidatePath("/rentals");
}
