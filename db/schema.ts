import { date, doublePrecision, index, integer, pgTable, text, timestamp, uuid, uniqueIndex } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  displayName: text("display_name"),
  preferredName: text("preferred_name"),
  homeCity: text("home_city"),
  preferredPropertyType: text("preferred_property_type", { enum: ["house","apartment","boarding_house","bedspace"] }),
  preferredBudgetPesos: integer("preferred_budget_pesos"),
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
  latitude: doublePrecision("latitude"),
  longitude: doublePrecision("longitude"),
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
export const platformEvents = pgTable("platform_events", {
  id: uuid("id").primaryKey().defaultRandom(),
  actorUserId: text("actor_user_id").notNull().references(() => users.id),
  kind: text("kind", { enum: ["listing.submitted","listing.paused","listing.approved","listing.rejected"] }).notNull(),
  listingId: uuid("listing_id").references(() => listings.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index("platform_events_recent_idx").on(table.createdAt),
  index("platform_events_actor_idx").on(table.actorUserId, table.createdAt),
]);
export const emailPasswordCredentials = pgTable("email_password_credentials", {
  userId: text("user_id").primaryKey().references(() => users.id, { onDelete: "cascade" }),
  passwordHash: text("password_hash").notNull(),
  verifiedAt: timestamp("verified_at", { withTimezone: true }),
  passwordUpdatedAt: timestamp("password_updated_at", { withTimezone: true }).notNull().defaultNow(),
});
export const authEmailTokens = pgTable("auth_email_tokens", {
  tokenHash: text("token_hash").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  purpose: text("purpose", {enum:["verify","reset"]}).notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, table => [index("auth_email_tokens_user_idx").on(table.userId, table.purpose)]);
export const authRateLimits = pgTable("auth_rate_limits", {
  key: text("key").primaryKey(),
  attempts: integer("attempts").notNull().default(0),
  windowStartedAt: timestamp("window_started_at", { withTimezone: true }).notNull().defaultNow(),
});
export type Listing = typeof listings.$inferSelect;

export const rentalUnits = pgTable("rental_units", {
  id: uuid("id").primaryKey().defaultRandom(),
  listingId: uuid("listing_id").notNull().references(() => listings.id, { onDelete: "cascade" }),
  label: text("label").notNull(),
  status: text("status", { enum: ["available", "reserved", "occupied", "unavailable"] }).notNull().default("available"),
  monthlyRentCentavos: integer("monthly_rent_centavos").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const rentalConversations=pgTable("rental_conversations",{
 id:uuid("id").primaryKey().defaultRandom(),listingId:uuid("listing_id").notNull().references(()=>listings.id),
 ownerId:text("owner_id").notNull().references(()=>users.id),renterId:text("renter_id").notNull().references(()=>users.id),
 createdAt:timestamp("created_at",{withTimezone:true}).notNull().defaultNow(),
});
export const rentalMessages=pgTable("rental_messages",{
 id:uuid("id").primaryKey(),conversationId:uuid("conversation_id").notNull().references(()=>rentalConversations.id),
 senderId:text("sender_id").notNull().references(()=>users.id),body:text("body").notNull(),createdAt:timestamp("created_at",{withTimezone:true}).notNull().defaultNow(),
});
export const rentalNotifications=pgTable("rental_notifications",{
 id:uuid("id").primaryKey().defaultRandom(),userId:text("user_id").notNull().references(()=>users.id),conversationId:uuid("conversation_id").notNull().references(()=>rentalConversations.id),
 kind:text("kind",{enum:["inquiry","message","tenancy","payment","reminder"]}).notNull(),body:text("body").notNull(),eventKey:text("event_key").notNull().unique(),
 readAt:timestamp("read_at",{withTimezone:true}),createdAt:timestamp("created_at",{withTimezone:true}).notNull().defaultNow(),
});
export const rentalTenancies=pgTable("rental_tenancies",{
 id:uuid("id").primaryKey().defaultRandom(),conversationId:uuid("conversation_id").notNull().references(()=>rentalConversations.id),unitId:uuid("unit_id").notNull().references(()=>rentalUnits.id),
 status:text("status",{enum:["invited","active","ended","declined"]}).notNull().default("invited"),monthlyRentCentavos:integer("monthly_rent_centavos").notNull(),
 startsOn:date("starts_on").notNull(),endedOn:date("ended_on"),createdAt:timestamp("created_at",{withTimezone:true}).notNull().defaultNow(),
});
export const rentCharges=pgTable("rent_charges",{
 id:uuid("id").primaryKey().defaultRandom(),tenancyId:uuid("tenancy_id").notNull().references(()=>rentalTenancies.id),dueOn:date("due_on").notNull(),description:text("description").notNull(),
 amountCentavos:integer("amount_centavos").notNull(),voidedAt:timestamp("voided_at",{withTimezone:true}),voidReason:text("void_reason"),createdAt:timestamp("created_at",{withTimezone:true}).notNull().defaultNow(),
});
export const rentPayments=pgTable("rent_payments",{
 id:uuid("id").primaryKey(),chargeId:uuid("charge_id").notNull().references(()=>rentCharges.id),amountCentavos:integer("amount_centavos").notNull(),paidOn:date("paid_on").notNull(),note:text("note").notNull().default(""),
 recordedBy:text("recorded_by").notNull().references(()=>users.id),voidedAt:timestamp("voided_at",{withTimezone:true}),voidReason:text("void_reason"),createdAt:timestamp("created_at",{withTimezone:true}).notNull().defaultNow(),
});
export const listingReactions=pgTable("listing_reactions",{
 listingId:uuid("listing_id").notNull().references(()=>listings.id,{onDelete:"cascade"}),userId:text("user_id").notNull().references(()=>users.id,{onDelete:"cascade"}),kind:text("kind",{enum:["like","love","interested"]}).notNull(),
});
