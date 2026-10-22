import {z} from "zod";

const id=z.string().uuid();
const date=z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine(s=>{const d=new Date(s+"T00:00:00Z");return Number.isFinite(+d)&&d.toISOString().slice(0,10)===s;},"Use a valid date");
const money=z.string().trim().regex(/^\d{1,7}(\.\d{1,2})?$/).transform(v=>Math.round(Number(v)*100)).pipe(z.number().int().min(100).max(500000000));
const moneyZero=z.string().trim().regex(/^\d{1,7}(\.\d{1,2})?$/).transform(v=>Math.round(Number(v)*100)).pipe(z.number().int().min(0).max(500000000));
const commonTerms={
 monthlyRent:money,
 securityDeposit:moneyZero,
 reservationAmount:moneyZero,
 reservationHours:z.coerce.number().int().min(1).max(168),
 reservationCredit:z.enum(["none","first_rent","deposit"]),
 leaseStartsOn:date,
 moveInOn:date,
 leaseEndsOn:date.optional().or(z.literal("")),
 note:z.string().trim().max(500).default(""),
};

export const rentalOfferAction=z.discriminatedUnion("action",[
 z.object({action:z.literal("makeOffer"),conversationId:id,unitId:id,monthlyRent:money,moveInOn:date,note:z.string().trim().max(500).default("")}),
 z.object({action:z.literal("counterOffer"),offerId:id,...commonTerms}),
 z.object({action:z.literal("acceptOffer"),offerId:id}),
 z.object({action:z.literal("declineOffer"),offerId:id,reason:z.string().trim().max(500).default("")}),
 z.object({action:z.literal("withdrawOffer"),offerId:id}),
]);
export type RentalOfferAction=z.infer<typeof rentalOfferAction>;
