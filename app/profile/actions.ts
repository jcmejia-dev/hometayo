"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { profileSettingsSchema } from "@/lib/profile-settings";
import { users } from "@/db/schema";
import { getDatabase } from "@/lib/db";
import { requireAccount } from "@/lib/session-user";

function field(form: FormData, key: string): string {
  const value = form.get(key);
  return typeof value === "string" ? value : "";
}

export async function updateProfile(form: FormData) {
  const account = await requireAccount();
  const parsed = profileSettingsSchema.safeParse({
    preferredName: field(form,"preferredName"),
    homeCity: field(form,"homeCity"),
    preferredPropertyType: field(form,"preferredPropertyType"),
    preferredBudgetPesos: field(form,"preferredBudgetPesos"),
  });
  if (!parsed.success) throw new Error("Please check your profile settings and try again.");
  const values = parsed.data;
  const db = getDatabase();
  if (!db) throw new Error("Database is not configured.");
  await db.update(users).set({
    preferredName: values.preferredName || null,
    homeCity: values.homeCity || null,
    preferredPropertyType: values.preferredPropertyType || null,
    preferredBudgetPesos: values.preferredBudgetPesos === "" ? null : values.preferredBudgetPesos,
    updatedAt: new Date(),
  }).where(and(eq(users.id, account.id),eq(users.email, account.email)));
  revalidatePath("/profile");
  revalidatePath("/owner");
  redirect("/profile?saved=1");
}
