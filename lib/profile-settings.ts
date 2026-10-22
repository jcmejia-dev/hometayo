import { z } from "zod";

export const avatarConfigSchema=z.object({
  skin:z.enum(["#FBE0CF","#F3C6A8","#E8B894","#D99A70","#C9825A","#A96649","#7A4937","#513027"]),
  faceShape:z.enum(["oval","round","soft-square","heart"]).default("oval"),
  hair:z.enum(["crop","waves","bun","spikes","curly","bob","fade","braids","ponytail","buzz"]),
  hairColor:z.enum(["#171717","#33251F","#51352A","#70422C","#8B4A2B","#B56C34","#D19A4A","#7D7270","#5B3B7D"]),
  brows:z.enum(["soft","straight","arched","bold"]).default("soft"),
  facialHair:z.enum(["none","stubble","mustache","goatee","beard"]).default("none"),
  outfit:z.enum(["#1F6F50","#2F67C7","#E4813D","#7A55B5","#D75A75","#303846","#B94B43","#2B8B8B","#C99A34"]),
  outfitStyle:z.enum(["tee","collared","hoodie","sweater","blazer"]).default("tee"),
  accessory:z.enum(["none","round-glasses","square-glasses","earrings","cap","headband"]).default("none"),
  background:z.enum(["#DFF4E8","#DCEEFF","#FFE6D5","#EEE2FF","#FFF1BF","#E7EBEE","#DDEDE9","#F7DEEA","#E9E4D7"]),
  expression:z.enum(["smile","happy","wink","calm","confident","cool"]),
});

export const profileSettingsSchema = z.object({
  preferredName: z.string().trim().max(80).refine((v) => v.length === 0 || v.length >= 2),
  homeCity: z.string().trim().max(80).refine((v) => v.length === 0 || v.length >= 2),
  preferredPropertyType: z.enum(["","house","apartment","boarding_house","bedspace"]),
  preferredBudgetPesos: z.union([z.literal(""),z.coerce.number().int().min(100).max(5_000_000)]),
  avatarConfig: avatarConfigSchema.optional(),
});
