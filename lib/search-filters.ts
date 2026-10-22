export const propertyTypes = ["house","apartment","boarding_house","bedspace"] as const;
export type PropertyType = (typeof propertyTypes)[number];
export type ListingPurpose = "rent"|"sale";
export type RentalFilters = { city: string; type?: PropertyType; purpose?:ListingPurpose; maxRentCentavos?: number; minBedrooms?: number };

function one(value: string | string[] | undefined): string {
  return typeof value === "string" ? value.trim().slice(0, 80) : "";
}
export function parseRentalFilters(raw: {
  city?: string | string[]; type?: string | string[]; purpose?:string|string[];
  maxRent?: string | string[]; bedrooms?: string | string[];
}): RentalFilters {
  const city = one(raw.city) || "Koronadal City";
  const typeRaw = one(raw.type),purposeRaw=one(raw.purpose);
  const maxRaw = one(raw.maxRent);
  const bedroomsRaw = one(raw.bedrooms);
  const type = propertyTypes.includes(typeRaw as PropertyType) ? typeRaw as PropertyType : undefined;
  const purpose=purposeRaw==="rent"||purposeRaw==="sale"?purposeRaw:undefined;
  const maxRentPesos = /^\d{1,7}$/.test(maxRaw) ? Number(maxRaw) : NaN;
  const bedroomCount = /^[1-9]\d?$/.test(bedroomsRaw) ? Number(bedroomsRaw) : NaN;
  return {
    city,
    ...(type ? { type } : {}),
    ...(purpose?{purpose}:{}),
    ...(Number.isSafeInteger(maxRentPesos) && maxRentPesos > 0 && maxRentPesos <= 9_999_999 ? { maxRentCentavos: maxRentPesos * 100 } : {}),
    ...(Number.isSafeInteger(bedroomCount) && bedroomCount > 0 && bedroomCount <= 20 ? { minBedrooms: bedroomCount } : {}),
  };
}
export function formatRent(centavos: number): string {
  return new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP", minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(centavos / 100);
}
