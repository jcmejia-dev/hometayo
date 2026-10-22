import { z } from "zod";

export const avatarConfigSchema=z.object({
  skin:z.enum(["#F7D7C4","#E8B894","#C9825A","#9A5B3E","#5D372A"]),
  hair:z.enum(["crop","waves","bun","spikes","curly"]),
  hairColor:z.enum(["#171717","#51352A","#8B4A2B","#D19A4A","#5B3B7D"]),
  outfit:z.enum(["#1F6F50","#2F67C7","#E4813D","#7A55B5","#D75A75","#303846"]),
  background:z.enum(["#DFF4E8","#DCEEFF","#FFE6D5","#EEE2FF","#FFF1BF","#E7EBEE"]),
  expression:z.enum(["smile","happy","wink","cool"]),
});

export const profileSettingsSchema = z.object({
  preferredName: z.string().trim().max(80).refine((v) => v.length === 0 || v.length >= 2),
  homeCity: z.string().trim().max(80).refine((v) => v.length === 0 || v.length >= 2),
  preferredPropertyType: z.enum(["","house","apartment","boarding_house","bedspace"]),
  preferredBudgetPesos: z.union([z.literal(""),z.coerce.number().int().min(100).max(5_000_000)]),
  avatarConfig: avatarConfigSchema.optional(),
});
