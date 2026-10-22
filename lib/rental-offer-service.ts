import "server-only";
import {neon} from "@neondatabase/serverless";
import {consumeRateLimit} from "./email-auth";
import {dispatchPendingRentalPushes} from "./push-notifications";
import {rentalOfferAction} from "./rental-offer-input";
import {performRentalOfferAction as performBaseRentalOfferAction,rentalOfferState} from "./rental-offers";

function client(){
 if(process.env.ENABLE_RENTAL_MANAGEMENT!=="true"||!process.env.DATABASE_URL)throw Error("Rental management is awaiting setup.");
 return neon(process.env.DATABASE_URL);
}

// This version deliberately makes the final result depend on every acceptance side-effect.
// Besides being explicit, it keeps PostgreSQL-compatible runtimes from pruning unreferenced
// data-modifying CTEs and guarantees the accepted offer is linked to its request/reservation.
export const ACCEPT_OFFER_V2=`WITH target AS MATERIALIZED (
 SELECT o.*,c.owner_id,c.renter_id FROM rental_offers o
 JOIN rental_conversations c ON c.id=o.conversation_id
 JOIN rental_units u ON u.id=o.unit_id
 WHERE o.id=$2::uuid AND o.status='pending' AND $1 IN(c.owner_id,c.renter_id) AND o.proposed_by<>$1
  AND NOT EXISTS(SELECT 1 FROM rental_tenancies t WHERE t.conversation_id=c.id AND t.status IN ('invited','reserved','active','ending'))
  AND NOT EXISTS(SELECT 1 FROM rental_reservations r WHERE r.conversation_id=c.id AND r.status IN ('awaiting_payment','proof_submitted','reserved'))
  AND NOT EXISTS(SELECT 1 FROM rental_requests rr WHERE rr.conversation_id=c.id AND rr.status='pending')
 FOR UPDATE OF o,u
), accepted AS (
 UPDATE rental_offers o SET status='accepted',accepted_by=$1,accepted_at=now(),responded_at=now()
 FROM target WHERE o.id=target.id RETURNING o.id
), deal AS (
 SELECT target.* FROM target JOIN accepted ON accepted.id=target.id
), req AS (
 INSERT INTO rental_requests(conversation_id,unit_id,renter_id,desired_move_in_on,status,owner_note,created_at,decided_at)
 SELECT conversation_id,unit_id,renter_id,move_in_on,'approved','Agreed through HomeTayo offer negotiation',now(),now()
 FROM deal RETURNING *
), hold AS (
 INSERT INTO rental_reservations(request_id,conversation_id,unit_id,renter_id,owner_id,status,amount_centavos,credit_target,monthly_rent_centavos,security_deposit_centavos,starts_on,move_in_on,lease_ends_on,owner_note,expires_at,confirmed_at)
 SELECT req.id,deal.conversation_id,deal.unit_id,deal.renter_id,deal.owner_id,
  CASE WHEN deal.reservation_amount_centavos>0 THEN 'awaiting_payment' ELSE 'converted' END,
  deal.reservation_amount_centavos,deal.reservation_credit,deal.monthly_rent_centavos,deal.security_deposit_centavos,
  deal.lease_starts_on,deal.move_in_on,deal.lease_ends_on,'Terms accepted through HomeTayo offer negotiation',
  now()+make_interval(hours=>deal.reservation_hours),CASE WHEN deal.reservation_amount_centavos=0 THEN now() ELSE NULL END
 FROM deal CROSS JOIN req RETURNING *
), tenancy AS (
 INSERT INTO rental_tenancies(conversation_id,unit_id,status,monthly_rent_centavos,security_deposit_centavos,starts_on,lease_ends_on,move_in_on,approved_at)
 SELECT conversation_id,unit_id,'reserved',monthly_rent_centavos,security_deposit_centavos,starts_on,lease_ends_on,move_in_on,now()
 FROM hold WHERE amount_centavos=0 RETURNING *
), linked_hold AS (
 UPDATE rental_reservations r SET status='reserved',tenancy_id=tenancy.id
 FROM tenancy WHERE r.id=(SELECT id FROM hold) RETURNING r.id
), linked_request AS (
 UPDATE rental_requests rr SET tenancy_id=tenancy.id
 FROM tenancy WHERE rr.id=(SELECT id FROM req) RETURNING rr.id
), linked_offer AS (
 UPDATE rental_offers o SET request_id=req.id,reservation_id=hold.id
 FROM req,hold WHERE o.id=$2::uuid RETURNING o.id
), deposit_charge AS (
 INSERT INTO rent_charges(tenancy_id,due_on,description,amount_centavos,source,charge_kind)
 SELECT tenancy.id,tenancy.starts_on,'Security deposit',tenancy.security_deposit_centavos,'manual','deposit'
 FROM tenancy WHERE tenancy.security_deposit_centavos>0 RETURNING id
), rent_charge AS (
 INSERT INTO rent_charges(tenancy_id,due_on,description,amount_centavos,source,charge_kind)
 SELECT tenancy.id,tenancy.starts_on,to_char(tenancy.starts_on,'FMMonth YYYY')||' rent',tenancy.monthly_rent_centavos,'manual','rent'
 FROM tenancy RETURNING id
), counterpart_notice AS (
 INSERT INTO rental_notifications(user_id,conversation_id,kind,body,event_key)
 SELECT CASE WHEN deal.owner_id=$1 THEN deal.renter_id ELSE deal.owner_id END,deal.conversation_id,'offer',
  'Rental offer accepted. The agreed terms are now locked in.','offer-accepted:'||deal.id FROM deal
 ON CONFLICT(event_key) DO NOTHING RETURNING id
), renter_notice AS (
 INSERT INTO rental_notifications(user_id,conversation_id,kind,body,event_key)
 SELECT deal.renter_id,deal.conversation_id,'reservation',
  CASE WHEN deal.reservation_amount_centavos>0 THEN 'Offer accepted. Complete the reservation payment before the hold expires.' ELSE 'Offer accepted. Your unit is now reserved.' END,
  'offer-reservation:'||deal.id FROM deal
 ON CONFLICT(event_key) DO NOTHING RETURNING id
)
 SELECT linked_offer.id,
  (SELECT count(*) FROM tenancy) AS tenancy_count,
  (SELECT count(*) FROM linked_hold) AS linked_hold_count,
  (SELECT count(*) FROM linked_request) AS linked_request_count,
  (SELECT count(*) FROM deposit_charge) AS deposit_charge_count,
  (SELECT count(*) FROM rent_charge) AS rent_charge_count,
  (SELECT count(*) FROM counterpart_notice) AS counterpart_notice_count,
  (SELECT count(*) FROM renter_notice) AS renter_notice_count
 FROM linked_offer`;

export {rentalOfferState};

export async function performRentalOfferAction(userId:string,raw:unknown){
 const parsed=rentalOfferAction.parse(raw);
 if(parsed.action!=="acceptOffer")return performBaseRentalOfferAction(userId,raw);
 if(!await consumeRateLimit("rental-offers",userId,40,60))throw Error("Please wait a moment before changing the offer again.");
 let rows:Array<{id:string}>;
 try{rows=await client().query(ACCEPT_OFFER_V2,[userId,parsed.offerId]) as Array<{id:string}>;}
 catch(error){
  if(error instanceof Error&&/rental_offers|does not exist/i.test(error.message))throw Error("Offer negotiation is being enabled. Try again after the latest update.");
  throw error;
 }
 if(!rows.length)throw Error("That offer can no longer be accepted. Refresh and check the latest terms or unit availability.");
 await dispatchPendingRentalPushes();
 return {id:rows[0].id,message:"Offer accepted. The agreed terms are now in the reservation flow."};
}
