"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { users } from "@/db/schema";
import { getDatabase } from "@/lib/db";
import { requireAccount } from "@/lib/session-user";

export const profileSettingsSchema = z.object({
  preferredName: z.string().trim().max(80).refine((v) => v.length === 0 || v.length >= 2),
  homeCity: z.string().trim().max(80).refine((v) => v.length === 0 || v.length >= 2),
  preferredPropertyType: z.enum(["","house","apartment","boarding_house","bedspace"]),
  preferredBudgetPesos: z.union([z.literal(""),z.coerce.number().int().min(100).max(5_000_000)]),
});

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
