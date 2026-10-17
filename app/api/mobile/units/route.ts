import { NextResponse } from "next/server";
import { nativeAccount } from "@/lib/native-auth";
import { ownedUnits, saveUnit } from "@/lib/rental-units";
import { uuidInput, unitInput } from "@/lib/rental-unit-input";

export const dynamic = "force-dynamic";
const reply = (body: unknown, status = 200) => NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } });
export async function GET(request: Request) {
  try {
    const user = await nativeAccount(request);
    if (!user) return reply({ message: "Please sign in." }, 401);
    if (user.role !== "landlord") return reply({ message: "An owner account is required." }, 403);
    if (process.env.ENABLE_RENTAL_MANAGEMENT !== "true") return reply({ message: "Room management is awaiting database setup." }, 503);
    const id = uuidInput.safeParse(new URL(request.url).searchParams.get("listingId"));
    if (!id.success) return reply({ message: "Invalid property." }, 400);
    return reply({ units: await ownedUnits(id.data, user.id) });
  } catch { return reply({ message: "Could not load room availability. Please try again." }, 503); }
}
export async function POST(request: Request) {
  try {
    const user = await nativeAccount(request);
    if (!user) return reply({ message: "Please sign in." }, 401);
    if (user.role !== "landlord") return reply({ message: "An owner account is required." }, 403);
    const raw = await request.text();
    if (raw.length > 2000) return reply({ message: "Request too large." }, 413);
    let body;
    try { body = JSON.parse(raw); } catch { return reply({ message: "Invalid request." }, 400); }
    if (!body || !uuidInput.safeParse(body.listingId).success || !unitInput.safeParse(body).success || (body.unitId !== undefined && !uuidInput.safeParse(body.unitId).success)) return reply({ message: "Check the room label, rent, and availability." }, 400);
    await saveUnit(body.listingId, user.id, body, body.unitId);
    return reply({ message: "Room availability saved." });
  } catch { return reply({ message: "Could not save. Check property access and use a unique room label." }, 400); }
}
