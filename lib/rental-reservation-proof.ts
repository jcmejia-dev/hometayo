import "server-only";
import {neon} from "@neondatabase/serverless";
import type {RentalOperation} from "./rental-operation-input";
import {dispatchPendingRentalPushes} from "./push-notifications";

type SubmitReservationProof=Extract<RentalOperation,{action:"submitReservationProof"}>;
type SubmitPaymentProof=Extract<RentalOperation,{action:"submitPaymentProof"}>;

// PostgreSQL cannot infer an unknown proof-url parameter when it is both assigned
// to a text column and independently tested with IS NOT NULL. Keep multipart proof
// fields explicitly typed so Neon and PGlite execute the exact same statements.
export const SUBMIT_RESERVATION_PROOF_TYPED=`WITH r AS (
 UPDATE rental_reservations r SET status='proof_submitted',payment_method=$3::text,proof_url=NULLIF($4::text,''),payment_reference=$5::text,submitted_at=now(),owner_note=''
 FROM rental_conversations c WHERE r.id=$2::uuid AND c.id=r.conversation_id AND c.renter_id=$1::text AND r.status='awaiting_payment' AND r.expires_at>now()
  AND r.amount_centavos>0 AND ($3::text='cash' OR NULLIF($4::text,'') IS NOT NULL) RETURNING r.*
), n AS (INSERT INTO rental_notifications(user_id,conversation_id,kind,body,event_key)
 SELECT owner_id,conversation_id,'payment_proof','Reservation payment proof was submitted for review.','reservation-proof:'||id||':'||extract(epoch from submitted_at)::bigint FROM r)
 SELECT id FROM r`;

export const SUBMIT_PAYMENT_PROOF_TYPED=`WITH charge AS MATERIALIZED (
 SELECT r.id,r.amount_centavos-COALESCE((SELECT sum(p.amount_centavos) FROM rent_payments p WHERE p.charge_id=r.id AND p.voided_at IS NULL),0) AS balance,
  c.id AS conversation_id,c.owner_id,c.renter_id
 FROM rent_charges r JOIN rental_tenancies t ON t.id=r.tenancy_id JOIN rental_conversations c ON c.id=t.conversation_id
 WHERE r.id=$2::uuid AND c.renter_id=$1::text AND r.voided_at IS NULL AND $3::integer>0
  AND $3::integer<=r.amount_centavos-COALESCE((SELECT sum(p.amount_centavos) FROM rent_payments p WHERE p.charge_id=r.id AND p.voided_at IS NULL),0)
), submission AS (
 INSERT INTO rent_payment_submissions(charge_id,renter_id,amount_centavos,paid_on,payment_method,proof_url,payment_reference,note)
 SELECT id,$1::text,$3::integer,$4::date,$5::text,NULLIF($6::text,''),$7::text,$8::text FROM charge
 WHERE $5::text='cash' OR NULLIF($6::text,'') IS NOT NULL RETURNING *
), n AS (INSERT INTO rental_notifications(user_id,conversation_id,kind,body,event_key)
 SELECT charge.owner_id,charge.conversation_id,'payment_proof','A rent payment was submitted for verification.','payment-proof:'||submission.id
 FROM submission JOIN charge ON charge.id=submission.charge_id)
 SELECT id FROM submission`;

function client(){
 if(process.env.ENABLE_RENTAL_MANAGEMENT!=="true"||!process.env.DATABASE_URL)throw Error("Rental management is awaiting setup.");
 return neon(process.env.DATABASE_URL);
}

export async function submitReservationProofTyped(userId:string,v:SubmitReservationProof){
 const rows=await client().query(SUBMIT_RESERVATION_PROOF_TYPED,[userId,v.reservationId,v.paymentMethod,v.proofUrl??"",v.paymentReference]) as Array<{id:string}>;
 if(!rows.length)throw Error("Action unavailable. Check the reservation status, payment window, proof, and your access.");
 await dispatchPendingRentalPushes();
 return {id:rows[0].id,message:"Proof submitted for owner review."};
}

export async function submitPaymentProofTyped(userId:string,v:SubmitPaymentProof){
 const rows=await client().query(SUBMIT_PAYMENT_PROOF_TYPED,[userId,v.chargeId,v.amount,v.paidOn,v.paymentMethod,v.proofUrl??"",v.paymentReference,v.note]) as Array<{id:string}>;
 if(!rows.length)throw Error("Action unavailable. Check the charge balance, payment proof, and your access.");
 await dispatchPendingRentalPushes();
 return {id:rows[0].id,message:"Payment submitted for owner verification."};
}
