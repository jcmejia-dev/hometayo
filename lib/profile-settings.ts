import { z } from "zod";

export const profileSettingsSchema = z.object({
  preferredName: z.string().trim().max(80).refine((v) => v.length === 0 || v.length >= 2),
  homeCity: z.string().trim().max(80).refine((v) => v.length === 0 || v.length >= 2),
  preferredPropertyType: z.enum(["","house","apartment","boarding_house","bedspace"]),
  preferredBudgetPesos: z.union([z.literal(""),z.coerce.number().int().min(100).max(5_000_000)]),
});
