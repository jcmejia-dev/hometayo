import { NextResponse } from "next/server";
import { publicUnits } from "@/lib/rental-units";
import { uuidInput } from "@/lib/rental-unit-input";
export async function GET(request: Request) {
  const id = uuidInput.safeParse(new URL(request.url).searchParams.get("listingId"));
  if (!id.success) return NextResponse.json({ message: "Invalid property." }, { status: 400 });
  try { return NextResponse.json({ units: await publicUnits(id.data) }, { headers: { "Cache-Control": "no-store" } }); }
  catch { return NextResponse.json({ message: "Availability is temporarily unavailable." }, { status: 503 }); }
}
