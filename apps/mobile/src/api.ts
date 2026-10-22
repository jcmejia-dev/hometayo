/** Public-only HomeTayo API. Never import a Neon URL or Auth.js secret into the APK. */
export type Rental = {
  slug: string;
  title: string;
  description:string;
  propertyType: "house" | "apartment" | "boarding_house" | "bedspace";
  listingPurpose:"rent"|"sale";
  salePriceCentavos:number|null;
  city: string;
  barangay: string;
  monthlyRentCentavos: number;
  bedrooms: number | null;
  bathrooms: number | null;
  rentalMode: string;
  lastConfirmedAt: string | null;
  ownerName:string;
  ownerPhoto:string|null;
  ownerVerified?:boolean;
  photoUrl:string|null;
  unitCounts?:{total:number;available:number}|null;
};
export type RentalDetail = Rental & {
  photoUrls?:string[];
  units?: Array<{id:string;label:string;status:string;monthlyRentCentavos:number}>;
  province: string;
  furnished: string;
  availableSlots: number | null;
  contactUrl: string | null;
};

const DEFAULT_SERVER = "https://hometayoph.vercel.app";
function trustedBaseUrl(): string {
  const raw=process.env.EXPO_PUBLIC_API_URL || DEFAULT_SERVER;
  const url=new URL(raw);
  if(url.protocol!=="https:" && !(url.protocol==="http:"&&["localhost","127.0.0.1"].includes(url.hostname)))
    throw Error("HomeTayo API must use HTTPS");
  return url.origin;
}

async function getJson(path:string,signal?:AbortSignal):Promise<unknown>{
  const response=await fetch(trustedBaseUrl()+path,{method:"GET",headers:{"Accept":"application/json"},signal});
  if(!response.ok) throw Error(response.status===503 ? "HomeTayo marketplace is temporarily unavailable." : response.status===404 ? "This property is no longer available." : "Could not load listings. Try again.");
  return response.json();
}

export async function fetchRentals(city:string,type:string="",purpose:""|"rent"|"sale"="",signal?:AbortSignal):Promise<Rental[]> {
  const search=new URLSearchParams();
  search.set("city",city.trim().slice(0,80)||"Koronadal City");
  if(["house","apartment","boarding_house","bedspace"].includes(type)) search.set("type",type);
  if(purpose)search.set("purpose",purpose);
  const data=await getJson("/api/public/listings?"+search.toString(),signal);
  if(!data || typeof data!=="object" || !("listings" in data) || !Array.isArray(data.listings))throw Error("HomeTayo sent an invalid response.");
  return (data.listings as Rental[]).filter(item=>typeof item?.slug==="string"&&typeof item?.title==="string");
}
export async function fetchRentalDetail(slug:string,signal?:AbortSignal):Promise<RentalDetail> {
  if(!/^[a-z0-9][a-z0-9-]{0,119}$/.test(slug)) throw Error("Invalid property");
  const data=await getJson("/api/public/listings/"+encodeURIComponent(slug),signal);
  if(!data||typeof data!=="object"||typeof (data as RentalDetail).description!=="string")throw Error("Property details were unavailable.");
  return data as RentalDetail;
}
export function rentLabel(centavos:number):string{return "₱"+Math.round(centavos/100).toLocaleString("en-PH");}
export function priceLabel(item:{listingPurpose:"rent"|"sale";monthlyRentCentavos:number;salePriceCentavos:number|null}):string{return item.listingPurpose==="sale"?`${rentLabel(item.salePriceCentavos||0)}`:`${rentLabel(item.monthlyRentCentavos)} / month`;}
export function propertyLabel(type:string):string{return ({house:"House",apartment:"Apartment",boarding_house:"Boarding house",bedspace:"Bedspace"} as Record<string,string>)[type] || "Property";}
