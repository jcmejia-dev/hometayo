import { z } from "zod";

export const unitStatuses = ["available", "reserved", "occupied", "unavailable"] as const;
export const unitInput = z.object({
  label: z.string().trim().min(1).max(60),
  status: z.enum(unitStatuses),
  monthlyRent: z.string().trim().regex(/^\d{1,7}(\.\d{1,2})?$/)
    .transform(value => Math.round(Number(value) * 100))
    .pipe(z.number().int().min(100).max(500000000)),
});
export const uuidInput = z.string().uuid();
export type RentalUnit = {
  id: string; label: string; status: typeof unitStatuses[number]; monthlyRentCentavos: number;
};
