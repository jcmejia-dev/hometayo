import { z } from "zod";

export const propertyTypes = ["house", "apartment", "boarding_house", "bedspace"] as const;
export const rentalModes = ["whole_unit", "per_room", "per_bed"] as const;

const cleanText = (min: number, max: number) => z.string().trim().min(min).max(max);
export const propertyInputSchema = z.object({
  title: cleanText(8, 120),
  description: cleanText(30, 4000),
  propertyType: z.enum(propertyTypes),
  rentalMode: z.enum(rentalModes),
  city: cleanText(2, 80),
  barangay: cleanText(2, 80),
  monthlyRent: z.coerce.number().int().min(100).max(5_000_000),
  bedrooms: z.union([z.literal(""), z.coerce.number().int().min(0).max(99)]),
  bathrooms: z.union([z.literal(""), z.coerce.number().int().min(0).max(99)]),
  availableSlots: z.union([z.literal(""), z.coerce.number().int().min(0).max(999)]),
  furnished: z.enum(["yes", "no", "partial", "unspecified"]),
  ownerContactKind: z.enum(["messenger", "phone", "none"]),
  ownerContactValue: z.string().trim().max(200),
});

export type PropertyInput = z.infer<typeof propertyInputSchema>;

export function validateContact(kind: PropertyInput["ownerContactKind"], value: string) {
  if (kind === "none") return value.length === 0;
  if (kind === "phone") return /^\+?[0-9 ()-]{7,20}$/.test(value);
  try {
    const url = new URL(value);
    return url.protocol === "https:" &&
      ["m.me", "messenger.com", "www.messenger.com", "facebook.com", "www.facebook.com"].includes(url.hostname);
  } catch {
    return false;
  }
}

export function generateSlug(title: string, suffix: string): string {
  const base = title.toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 75).replace(/-$/g, "");
  return (base || "rental") + "-" + suffix.toLowerCase().replace(/[^a-f0-9]/g, "").slice(0, 12);
}
