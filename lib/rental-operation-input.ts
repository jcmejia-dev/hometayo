import { z } from "zod";
const id=z.string().uuid();
const date=z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine(s=>{const d=new Date(s+"T00:00:00Z");return Number.isFinite(+d)&&d.toISOString().slice(0,10)===s;},"Use a valid date");
const money=z.string().trim().regex(/^\d{1,7}(\.\d{1,2})?$/).transform(v=>Math.round(Number(v)*100)).pipe(z.number().int().min(1).max(500000000));
const message=z.object({action:z.literal("message"),conversationId:id,eventId:id,body:z.string().trim().min(1).max(2000),replyToId:id.nullable().optional(),mediaType:z.enum(["text","gif"]).default("text")});
export const rentalOperation=z.discriminatedUnion("action",[
 z.object({action:z.literal("inquire"),slug:z.string().regex(/^[a-z0-9][a-z0-9-]{0,119}$/)}),
 message,
 z.object({action:z.literal("messageReact"),messageId:id,emoji:z.enum(["👍","❤️","😂","😮","😢","🙏","none"])}),
 z.object({action:z.literal("read"),notificationId:id}),
 z.object({action:z.literal("invite"),conversationId:id,unitId:id,monthlyRent:money.pipe(z.number().min(100)),startsOn:date}),
 z.object({action:z.literal("accept"),tenancyId:id}),
 z.object({action:z.literal("decline"),tenancyId:id}),
 z.object({action:z.literal("end"),tenancyId:id,endedOn:date}),
 z.object({action:z.literal("charge"),tenancyId:id,dueOn:date,description:z.string().trim().min(1).max(120),amount:money.pipe(z.number().min(100))}),
 z.object({action:z.literal("payment"),chargeId:id,eventId:id,amount:money,paidOn:date,note:z.string().trim().max(250).default("")}),
 z.object({action:z.literal("void"),paymentId:id,reason:z.string().trim().min(1).max(250)}),
 z.object({action:z.literal("voidCharge"),chargeId:id,reason:z.string().trim().min(1).max(250)}),
 z.object({action:z.literal("remind"),chargeId:id}),
 z.object({action:z.literal("react"),slug:z.string().regex(/^[a-z0-9][a-z0-9-]{0,119}$/),kind:z.enum(["like","love","interested","none"])}),
]);
export type RentalOperation=z.infer<typeof rentalOperation>;
