"use server";

import { and, eq, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { users } from "@/db/schema";
import { getDatabase } from "@/lib/db";
import { requireAccount } from "@/lib/session-user";

export async function chooseAccountExperience(form: FormData) {
  const account = await requireAccount();
  const audience = form.get("audience");
  if (audience !== "renter" && audience !== "owner") throw new Error("Choose renter or property owner.");
  const db = getDatabase();
  if (!db) throw new Error("Account settings are temporarily unavailable.");
  // Only ordinary member roles can change. Administrator/moderator privileges are never set by this form.
  await db.update(users).set({ role: audience === "owner" ? "landlord" : "renter", updatedAt: new Date() })
    .where(and(eq(users.id, account.id), inArray(users.role, ["renter", "landlord"])));
  revalidatePath("/profile");
  revalidatePath("/");
  redirect(audience === "owner" ? "/owner" : "/");
}
