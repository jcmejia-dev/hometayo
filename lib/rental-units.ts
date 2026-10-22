import "server-only";
import { neon } from "@neondatabase/serverless";
import { CREATE_UNIT, ENSURE_INITIAL_UNITS, UPDATE_UNIT, OWNED_UNITS, PUBLIC_UNITS } from "./rental-unit-sql";
import { unitInput, uuidInput, type RentalUnit } from "./rental-unit-input";

function client() {
  if (!process.env.DATABASE_URL) throw new Error("Database is not configured.");
  return neon(process.env.DATABASE_URL);
}
export async function ownedUnits(listingId: string, userId: string): Promise<RentalUnit[]> {
  const id=uuidInput.parse(listingId),db=client();
  let rows=await db.query(OWNED_UNITS,[id,userId]) as RentalUnit[];
  if(!rows.length){
    await db.query(ENSURE_INITIAL_UNITS,[id,userId]);
    rows=await db.query(OWNED_UNITS,[id,userId]) as RentalUnit[];
  }
  return rows;
}
export async function publicUnits(listingId: string): Promise<RentalUnit[]> {
  if (process.env.ENABLE_RENTAL_MANAGEMENT !== "true") return [];
  return await client().query(PUBLIC_UNITS, [uuidInput.parse(listingId)]) as RentalUnit[];
}
export async function saveUnit(listingId: string, userId: string, input: unknown, unitId?: string) {
  if (process.env.ENABLE_RENTAL_MANAGEMENT !== "true") throw new Error("Rental management is awaiting database setup.");
  const v = unitInput.parse(input);
  const args = [uuidInput.parse(listingId), userId];
  const rows = unitId
    ? await client().query(UPDATE_UNIT, [...args, uuidInput.parse(unitId), v.label, v.status, v.monthlyRent])
    : await client().query(CREATE_UNIT, [...args, v.label, v.status, v.monthlyRent]);
  if (!rows.length) throw new Error("Property not found or access denied.");
}
