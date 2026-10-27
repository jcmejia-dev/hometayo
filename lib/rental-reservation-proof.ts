import "server-only";
import {neon} from "@neondatabase/serverless";
import type {RentalOperation} from "./rental-operation-input";
import {dispatchPendingRentalPushes} from "./push-notifications";

type SubmitReservationProof=Extract<RentalOperation,{action:"submitReservationProof"}>;

// PostgreSQL cannot infer $4 when the same unknown parameter is assigned to a
// text column and independently tested with IS NOT NULL. Keep every multipart
// proof field explicitly typed so Neon and PGlite execute the same statement.
export const SUBMIT_RESERVATION_PROOF_TYPED=`WITH r AS (
 UPDATE rental_reservations r SET status='proof_submitted',payment_method=$3::text,proof_url=NULLIF($4::text,''),payment_reference=$5::text,submitted_at=now(),owner_note=''
 FROM rental_conversations c WHERE r.id=$2::uuid AND c.id=r.conversation_id AND c.renter_id=$1::text AND r.status='awaiting_payment' AND r.expires_at>now()
  AND r.amount_centavos>0 AND ($3::text='cash' OR NULLIF($4::text,'') IS NOT NULL) RETURNING r.*
), n AS (INSERT INTO rental_notifications(user_id,conversation_id,kind,body,event_key)
 SELECT owner_id,conversation_id,'payment_proof','Reservation payment proof was submitted for review.','reservation-proof:'||id||':'||extract(epoch from submitted_at)::bigint FROM r)
 SELECT id FROM r`;

export async function submitReservationProofTyped(userId:string,v:SubmitReservationProof){
 if(process.env.ENABLE_RENTAL_MANAGEMENT!=="true"||!process.env.DATABASE_URL)throw Error("Rental management is awaiting setup.");
 const sql=neon(process.env.DATABASE_URL);
 const rows=await sql.query(SUBMIT_RESERVATION_PROOF_TYPED,[userId,v.reservationId,v.paymentMethod,v.proofUrl??"",v.paymentReference]) as Array<{id:string}>;
 if(!rows.length)throw Error("Action unavailable. Check the reservation status, payment window, proof, and your access.");
 await dispatchPendingRentalPushes();
 return {id:rows[0].id,message:"Proof submitted for owner review."};
}
