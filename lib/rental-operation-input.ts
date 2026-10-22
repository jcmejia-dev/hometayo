import { z } from "zod";
const id=z.string().uuid();
const date=z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine(s=>{const d=new Date(s+"T00:00:00Z");return Number.isFinite(+d)&&d.toISOString().slice(0,10)===s;},"Use a valid date");
const money=z.string().trim().regex(/^\d{1,7}(\.\d{1,2})?$/).transform(v=>Math.round(Number(v)*100)).pipe(z.number().int().min(1).max(500000000));
const moneyZero=z.string().trim().regex(/^\d{1,7}(\.\d{1,2})?$/).transform(v=>Math.round(Number(v)*100)).pipe(z.number().int().min(0).max(500000000));
const optionalMoneyZero=z.union([z.undefined(),moneyZero]).transform(v=>v??0);
const httpsUrl=z.string().trim().url().max(2000).refine(v=>{try{return new URL(v).protocol==="https:";}catch{return false;}},"Use an HTTPS URL");
const optionalHttpsUrl=z.union([z.literal(""),httpsUrl]).transform(v=>v||null);
const paymentMethod=z.enum(["gcash","maya","bank","cash","other"]);
const message=z.object({action:z.literal("message"),conversationId:id,eventId:id,body:z.string().trim().min(1).max(2000),replyToId:id.nullable().optional(),mediaType:z.enum(["text","gif"]).default("text")});
export const rentalOperation=z.discriminatedUnion("action",[
 z.object({action:z.literal("inquire"),slug:z.string().regex(/^[a-z0-9][a-z0-9-]{0,119}$/)}),
 message,
 z.object({action:z.literal("typing"),conversationId:id}),
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
 z.object({action:z.literal("requestRent"),conversationId:id,unitId:id,desiredMoveInOn:date}),
 z.object({action:z.literal("cancelRentRequest"),requestId:id}),
 z.object({action:z.literal("approveRentRequest"),requestId:id,monthlyRent:money.pipe(z.number().min(100)),securityDeposit:moneyZero,leaseStartsOn:date,leaseEndsOn:date.optional().or(z.literal("")),moveInOn:date,ownerNote:z.string().trim().max(500).default(""),reservationAmount:optionalMoneyZero,reservationHours:z.coerce.number().int().min(1).max(168).default(48),reservationCredit:z.enum(["none","first_rent","deposit"]).default("none")}),
 z.object({action:z.literal("declineRentRequest"),requestId:id,ownerNote:z.string().trim().max(500).default("")}),
 z.object({action:z.literal("submitReservationProof"),reservationId:id,paymentMethod,proofUrl:optionalHttpsUrl,paymentReference:z.string().trim().max(120).default("")}),
 z.object({action:z.literal("confirmReservationPayment"),reservationId:id}),
 z.object({action:z.literal("rejectReservationProof"),reservationId:id,reason:z.string().trim().min(1).max(250)}),
 z.object({action:z.literal("cancelReservation"),reservationId:id,reason:z.string().trim().max(250).default("")}),
 z.object({action:z.literal("activateTenancy"),tenancyId:id}),
 z.object({action:z.literal("requestMoveOut"),tenancyId:id,endingOn:date}),
 z.object({action:z.literal("submitPaymentProof"),chargeId:id,amount:money,paidOn:date,paymentMethod,proofUrl:optionalHttpsUrl,paymentReference:z.string().trim().max(120).default(""),note:z.string().trim().max(250).default("")}),
 z.object({action:z.literal("confirmPaymentProof"),submissionId:id}),
 z.object({action:z.literal("rejectPaymentProof"),submissionId:id,reason:z.string().trim().min(1).max(250)}),
 z.object({action:z.literal("updatePaymentProfile"),gcashName:z.string().trim().max(120).default(""),gcashNumber:z.string().trim().max(32).default(""),mayaName:z.string().trim().max(120).default(""),mayaNumber:z.string().trim().max(32).default(""),bankLabel:z.string().trim().max(120).default(""),bankAccountName:z.string().trim().max(120).default(""),bankAccountNumber:z.string().trim().max(80).default(""),acceptsCash:z.boolean().default(false)}),
 z.object({action:z.literal("markEnding"),tenancyId:id,endingOn:date}),
 z.object({action:z.literal("maintenanceCreate"),tenancyId:id,title:z.string().trim().min(2).max(120),description:z.string().trim().min(2).max(2000),priority:z.enum(["low","normal","high","urgent"]),photoUrl:optionalHttpsUrl}),
 z.object({action:z.literal("maintenanceStatus"),requestId:id,status:z.enum(["in_progress","resolved"])}),
 z.object({action:z.literal("documentAdd"),tenancyId:id,kind:z.enum(["lease","receipt","proof_of_payment","id","other"]),label:z.string().trim().min(1).max(120),url:httpsUrl}),
 z.object({action:z.literal("documentDelete"),documentId:id}),
 z.object({action:z.literal("review"),tenancyId:id,targetType:z.enum(["property","person"]),rating:z.coerce.number().int().min(1).max(5),body:z.string().trim().max(1000).default("")}),
]);
export type RentalOperation=z.infer<typeof rentalOperation>;
