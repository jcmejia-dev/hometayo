"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { eq, sql } from "drizzle-orm";
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

  // Create listing and its operational event together in one SQL statement.
  const newId = randomUUID();
  await db.execute(sql`
    WITH created AS (
      INSERT INTO listings (
        id, owner_id, slug, title, description, property_type, rental_mode, status,
        city, barangay, province, monthly_rent_centavos, bedrooms, bathrooms,
        available_slots, furnished, owner_contact_kind, owner_contact_value, last_confirmed_at
      ) VALUES (
        ${newId}::uuid, ${profile.id}::uuid, ${generateSlug(value.title, newId.replace(/-/g, ""))},
        ${value.title}, ${value.description}, ${value.propertyType}, ${value.rentalMode},
        'pending_review', ${value.city}, ${value.barangay}, 'South Cotabato',
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
