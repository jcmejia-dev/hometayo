"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { eq, sql } from "drizzle-orm";
import { ownerProfiles } from "@/db/schema";
import { getDatabase } from "@/lib/db";
import { requireAccount } from "@/lib/session-user";
import { generateSlug, propertyInputSchema } from "@/lib/property-validation";
import {photoUrl} from "@/lib/rental-photo-input";

function stringField(form: FormData, key: string) {
  const value = form.get(key);
  return typeof value === "string" ? value : "";
}
function photoUrlsField(form:FormData):string[]|null{
  try{
    const value=JSON.parse(stringField(form,"photoUrls")||"[]") as unknown;
    if(!Array.isArray(value)||value.length>8||!value.every(item=>photoUrl.safeParse(item).success))return null;
    return value as string[];
  }catch{return null;}
}
function listingManagementReturnPath(form:FormData,id:string):string|null{
  const value=form.get("returnTo");
  const expected=`/owner/listings/${id}/units`;
  return typeof value==="string"&&value===expected?value:null;
}
function parsedProperty(form:FormData){
 return propertyInputSchema.safeParse({
  title:stringField(form,"title"),description:stringField(form,"description"),propertyType:stringField(form,"propertyType"),rentalMode:stringField(form,"rentalMode"),
  city:stringField(form,"city"),province:stringField(form,"province")||"South Cotabato",barangay:stringField(form,"barangay"),
  latitude:stringField(form,"latitude"),longitude:stringField(form,"longitude"),monthlyRent:stringField(form,"monthlyRent"),bedrooms:stringField(form,"bedrooms"),
  bathrooms:stringField(form,"bathrooms"),availableSlots:stringField(form,"availableSlots"),furnished:stringField(form,"furnished"),ownerContactKind:"none",ownerContactValue:"",
 });
}
function propertyError(parsed:ReturnType<typeof parsedProperty>){
 if(parsed.success)return "";
 const labels:Record<string,string>={title:"Property title",description:"Description",propertyType:"Property type",rentalMode:"Rent basis",city:"City",province:"Province",barangay:"Barangay",monthlyRent:"Monthly rent",bedrooms:"Bedrooms",bathrooms:"Bathrooms",availableSlots:"Available slots",furnished:"Furnishing",latitude:"Property location",longitude:"Property location"};
 return parsed.error.issues.map(issue=>`${labels[String(issue.path[0])]||"Rental details"}: ${issue.message}`).join(" ");
}
export async function createProperty(form: FormData): Promise<{error: string}> {
  try {
  const account = await requireAccount();
  if(account.role!=="landlord")return {error:"Please sign in with your property-owner account to submit a rental."};
  const parsed = parsedProperty(form);
  if (!parsed.success) return {error:propertyError(parsed)};
  const photoUrls=photoUrlsField(form);
  if(photoUrls===null)return {error:"Rental photos are invalid. Choose up to eight JPG, PNG, or WebP images and try again."};
  const value = parsed.data;
  const locationsReady=process.env.ENABLE_NATIVE_AUTH==="true"||process.env.ENABLE_RENTAL_MANAGEMENT==="true";
  if(!locationsReady && value.latitude!==null)return {error:"Property map pins are awaiting server setup. Remove the pin to submit without it, or try again after setup is complete."};
  const coordinateColumns=locationsReady?sql`, latitude, longitude`:sql``;
  const coordinateValues=locationsReady?sql`, ${value.latitude}, ${value.longitude}`:sql``;
  if(value.latitude!==null&&stringField(form,"locationConfirmed")!=="yes")return {error:"Tick the confirmation checkbox to confirm the selected property pin."};
  const db = getDatabase();
  if (!db) return {error:"Property submission is unavailable because the database is not configured. Your details have been kept; please try again later."};
  let [profile] = await db.select({ id: ownerProfiles.id }).from(ownerProfiles).where(eq(ownerProfiles.userId, account.id)).limit(1);
  if (!profile) {
    await db.insert(ownerProfiles).values({userId:account.id,publicName:(account.displayName||"Property owner").slice(0,150)}).onConflictDoNothing({target:ownerProfiles.userId});
    [profile] = await db.select({ id: ownerProfiles.id }).from(ownerProfiles).where(eq(ownerProfiles.userId, account.id)).limit(1);
  }
  if (!profile) throw new Error("Could not initialize the owner profile.");
  const newId = randomUUID();
  await db.execute(sql`
    WITH created AS (
      INSERT INTO listings (id,owner_id,slug,title,description,property_type,rental_mode,status,city,barangay,province${coordinateColumns},monthly_rent_centavos,bedrooms,bathrooms,available_slots,furnished,owner_contact_kind,owner_contact_value,last_confirmed_at,published_at)
      VALUES (${newId}::uuid,${profile.id}::uuid,${generateSlug(value.title,newId.replace(/-/g,""))},${value.title},${value.description},${value.propertyType},${value.rentalMode},'published',${value.city},${value.barangay},${value.province}${coordinateValues},${value.monthlyRent*100},${value.bedrooms===""?null:value.bedrooms},${value.bathrooms===""?null:value.bathrooms},${value.availableSlots===""?null:value.availableSlots},${value.furnished},${value.ownerContactKind},NULL,now(),now()) RETURNING id
    ), images AS (
      INSERT INTO listing_images(listing_id,storage_key,alt_text,display_order)
      SELECT created.id,v.url,'Owner supplied rental photo',v.position::int FROM created CROSS JOIN jsonb_array_elements_text(${JSON.stringify(photoUrls)}::jsonb) WITH ORDINALITY AS v(url,position) RETURNING listing_id
    )
    INSERT INTO platform_events(actor_user_id,kind,listing_id) SELECT ${account.id},'listing.submitted',id FROM created WHERE (SELECT count(*) FROM images)>=0
  `);
  } catch (error) {
    if (error instanceof Error && error.message === "Please sign in to continue.") return {error:"Your session has expired. Sign in again before submitting your rental."};
    const reference = randomUUID().slice(0,8);const code=error&&typeof error==="object"&&"code" in error&&typeof error.code==="string"?error.code:"SUBMISSION_FAILED";
    console.error("Property submission failed",{reference,code});
    return {error:`We could not submit your rental. Your details have been kept. Please try again; if it continues, share reference ${reference} with support.`};
  }
  revalidatePath("/owner");revalidatePath("/rentals","layout");revalidatePath("/");redirect("/owner?submitted=1");
}

export async function updatePropertyDetails(form:FormData):Promise<void>{
 const account=await requireAccount();
 if(account.role!=="landlord")throw new Error("A property-owner account is required.");
 const id=stringField(form,"id");if(!/^[0-9a-f-]{36}$/i.test(id))throw new Error("Invalid rental.");
 const parsed=parsedProperty(form);if(!parsed.success)throw new Error(propertyError(parsed));
 const value=parsed.data,db=getDatabase();if(!db)throw new Error("Database not configured.");
 const result=await db.execute(sql`UPDATE listings l SET title=${value.title},description=${value.description},property_type=${value.propertyType},rental_mode=${value.rentalMode},city=${value.city},province=${value.province},barangay=${value.barangay},monthly_rent_centavos=${value.monthlyRent*100},bedrooms=${value.bedrooms===""?null:value.bedrooms},bathrooms=${value.bathrooms===""?null:value.bathrooms},available_slots=${value.availableSlots===""?null:value.availableSlots},furnished=${value.furnished},updated_at=now()
 FROM owner_profiles o WHERE l.owner_id=o.id AND o.user_id=${account.id} AND l.id=${id}::uuid AND l.status NOT IN ('removed','rejected') RETURNING l.slug`);
 if(!result.rows.length)throw new Error("Rental not found or cannot be edited.");
 revalidatePath("/owner");revalidatePath(`/owner/listings/${id}/edit`);revalidatePath("/rentals","layout");revalidatePath("/");
 redirect("/owner?updated=1");
}

export async function publishProperty(form:FormData){
  const account=await requireAccount();if(account.role!=="landlord")throw Error("A property-owner account is required.");
  const id=form.get("id");if(typeof id!=="string"||!/^[0-9a-f-]{36}$/i.test(id))throw Error("Invalid listing ID.");
  const returnTo=listingManagementReturnPath(form,id);const db=getDatabase();if(!db)throw Error("Database not configured.");
  const result=await db.execute(sql`WITH changed AS (UPDATE listings l SET status='published',published_at=now(),last_confirmed_at=now(),updated_at=now() FROM owner_profiles o WHERE l.owner_id=o.id AND o.user_id=${account.id} AND l.id=${id}::uuid AND l.status IN ('draft','pending_review','paused') RETURNING l.id) INSERT INTO platform_events(actor_user_id,kind,listing_id) SELECT ${account.id},'listing.submitted',id FROM changed RETURNING listing_id`);
  if(!result.rows.length)throw Error("Listing not found, already live, or unavailable for publication.");
  revalidatePath("/owner");revalidatePath("/rentals","layout");revalidatePath("/");if(returnTo){revalidatePath(returnTo);redirect(`${returnTo}?availability=live`);}redirect("/owner?submitted=1");
}

export async function pauseProperty(form: FormData) {
  const account=await requireAccount();if(account.role!=="landlord")throw new Error("A property-owner account is required.");
  const id=form.get("id");if(typeof id!=="string"||!/^[0-9a-f-]{36}$/i.test(id))throw new Error("Invalid listing ID.");
  const returnTo=listingManagementReturnPath(form,id);const db=getDatabase();if(!db)throw new Error("Database not configured.");
  const [owner]=await db.select({id:ownerProfiles.id}).from(ownerProfiles).where(eq(ownerProfiles.userId,account.id)).limit(1);if(!owner)throw new Error("Owner profile not found.");
  await db.execute(sql`WITH paused AS (UPDATE listings SET status='paused',updated_at=now() WHERE id=${id}::uuid AND owner_id=${owner.id}::uuid AND status='published' RETURNING id) INSERT INTO platform_events(actor_user_id,kind,listing_id) SELECT ${account.id},'listing.paused',id FROM paused`);
  revalidatePath("/owner");revalidatePath("/rentals");if(returnTo){revalidatePath(returnTo);redirect(`${returnTo}?availability=paused`);}
}
