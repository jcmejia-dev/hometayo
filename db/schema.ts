import { index, integer, pgTable, text, timestamp, uuid, uniqueIndex } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  displayName: text("display_name"),
  role: text("role", { enum: ["renter","landlord","moderator","admin"] }).notNull().default("renter"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const ownerProfiles = pgTable("owner_profiles", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  publicName: text("public_name").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [uniqueIndex("owner_profiles_user_id_uidx").on(table.userId)]);

export const listings = pgTable("listings", {
  id: uuid("id").primaryKey().defaultRandom(),
  ownerId: uuid("owner_id").notNull().references(() => ownerProfiles.id),
  slug: text("slug").notNull().unique(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  propertyType: text("property_type", { enum: ["house","apartment","boarding_house","bedspace"] }).notNull(),
  rentalMode: text("rental_mode", { enum: ["whole_unit","per_room","per_bed"] }).notNull().default("whole_unit"),
  status: text("status", { enum: ["draft","pending_review","published","rejected","paused","occupied","removed"] }).notNull().default("draft"),
  province: text("province").notNull().default("South Cotabato"),
  city: text("city").notNull(),
  barangay: text("barangay").notNull(),
  monthlyRentCentavos: integer("monthly_rent_centavos").notNull(),
  bedrooms: integer("bedrooms"),
  bathrooms: integer("bathrooms"),
  availableSlots: integer("available_slots"),
  furnished: text("furnished", { enum: ["yes","no","partial","unspecified"] }).notNull().default("unspecified"),
  ownerContactKind: text("owner_contact_kind", { enum: ["messenger","phone","none"] }).notNull().default("none"),
  ownerContactValue: text("owner_contact_value"),
  publishedAt: timestamp("published_at", { withTimezone: true }),
  lastConfirmedAt: timestamp("last_confirmed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index("listings_public_search_idx").on(table.status, table.city, table.monthlyRentCentavos),
  index("listings_owner_status_idx").on(table.ownerId, table.status),
]);

export const listingImages = pgTable("listing_images", {
  id: uuid("id").primaryKey().defaultRandom(),
  listingId: uuid("listing_id").notNull().references(() => listings.id, { onDelete: "cascade" }),
  storageKey: text("storage_key").notNull(),
  altText: text("alt_text"),
  displayOrder: integer("display_order").notNull().default(0),
}, (table) => [index("listing_images_order_idx").on(table.listingId, table.displayOrder)]);

export const listingReviews = pgTable("listing_reviews", {
  id: uuid("id").primaryKey().defaultRandom(),
  listingId: uuid("listing_id").notNull().references(() => listings.id),
  reviewerId: text("reviewer_id").notNull().references(() => users.id),
  decision: text("decision", { enum: ["approved","rejected","removed"] }).notNull(),
  reason: text("reason"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
export type Listing = typeof listings.$inferSelect;
