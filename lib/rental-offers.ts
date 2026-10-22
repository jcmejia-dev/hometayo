import "server-only";
import {neon} from "@neondatabase/serverless";
import {consumeRateLimit} from "./email-auth";
import {dispatchPendingRentalPushes} from "./push-notifications";
import {rentalOfferAction,type RentalOfferAction} from "./rental-offer-input";
import type {RentalOfferState} from "./rental-offer-types";

function client(){if(process.env.ENABLE_RENTAL_MANAGEMENT!=="true"||!process.env.DATABASE_URL)throw Error("Rental management is awaiting setup.");return neon(process.env.DATABASE_URL);}

const OFFER_STATE=`SELECT o.id,o.conversation_id AS "conversationId",o.unit_id AS "unitId",u.label AS "unitLabel",u.monthly_rent_centavos AS "askingRentCentavos",
 o.parent_offer_id AS "parentOfferId",o.proposed_by AS "proposedBy",COALESCE(p.preferred_name,p.display_name,'HomeTayo user') AS "proposedByName",
 CASE WHEN o.proposed_by=c.owner_id THEN 'owner' ELSE 'renter' END AS "proposedByRole",o.proposed_by=$1 AS mine,o.status,
 o.monthly_rent_centavos AS "monthlyRentCentavos",o.security_deposit_centavos AS "securityDepositCentavos",o.reservation_amount_centavos AS "reservationAmountCentavos",
 o.reservation_credit AS "reservationCredit",o.reservation_hours AS "reservationHours",o.lease_starts_on::text AS "leaseStartsOn",o.move_in_on::text AS "moveInOn",
 o.lease_ends_on::text AS "leaseEndsOn",o.note,o.accepted_by AS "acceptedBy",o.accepted_at AS "acceptedAt",o.responded_at AS "respondedAt",
 o.request_id AS "requestId",o.reservation_id AS "reservationId",o.created_at AS "createdAt"
 FROM rental_offers o JOIN rental_conversations c ON c.id=o.conversation_id JOIN rental_units u ON u.id=o.unit_id JOIN users p ON p.id=o.proposed_by
 WHERE c.id=$2::uuid AND $1 IN(c.owner_id,c.renter_id) ORDER BY o.created_at DESC`;

const MAKE_OFFER=`WITH target AS MATERIALIZED (
 SELECT c.id AS conversation_id,c.owner_id,c.renter_id,u.id AS unit_id,u.label FROM rental_conversations c
 JOIN rental_units u ON u.listing_id=c.listing_id
 WHERE c.id=$2::uuid AND c.renter_id=$1 AND u.id=$3::uuid AND u.status<>'unavailable'
  AND (SELECT count(*) FROM rental_tenancies t WHERE t.unit_id=u.id AND t.status IN ('invited','reserved','active','ending'))
    +(SELECT count(*) FROM rental_reservations r WHERE r.unit_id=u.id AND r.tenancy_id IS NULL AND r.status IN ('awaiting_payment','proof_submitted'))<u.capacity
  AND NOT EXISTS(SELECT 1 FROM rental_tenancies t WHERE t.conversation_id=c.id AND t.status IN ('invited','reserved','active','ending'))
  AND NOT EXISTS(SELECT 1 FROM rental_reservations r WHERE r.conversation_id=c.id AND r.status IN ('awaiting_payment','proof_submitted','reserved'))
  AND NOT EXISTS(SELECT 1 FROM rental_requests rr WHERE rr.conversation_id=c.id AND rr.status='pending')
  AND NOT EXISTS(SELECT 1 FROM rental_offers ro WHERE ro.conversation_id=c.id AND ro.status='pending')
), offer AS (
 INSERT INTO rental_offers(conversation_id,unit_id,proposed_by,monthly_rent_centavos,lease_starts_on,move_in_on,note)
 SELECT conversation_id,unit_id,$1,$4,$5::date,$5::date,$6 FROM target RETURNING *
), n AS (INSERT INTO rental_notifications(user_id,conversation_id,kind,body,event_key)
 SELECT target.owner_id,target.conversation_id,'offer','New rental offer for '||target.label,'offer-created:'||offer.id
 FROM offer JOIN target ON target.conversation_id=offer.conversation_id)
 SELECT id FROM offer`;

const COUNTER_OFFER=`WITH current AS MATERIALIZED (
 SELECT o.*,c.owner_id,c.renter_id FROM rental_offers o JOIN rental_conversations c ON c.id=o.conversation_id
 WHERE o.id=$2::uuid AND o.status='pending' AND $1 IN(c.owner_id,c.renter_id) AND o.proposed_by<>$1
  AND NOT EXISTS(SELECT 1 FROM rental_tenancies t WHERE t.conversation_id=c.id AND t.status IN ('invited','reserved','active','ending'))
  AND NOT EXISTS(SELECT 1 FROM rental_reservations r WHERE r.conversation_id=c.id AND r.status IN ('awaiting_payment','proof_submitted','reserved'))
  AND NOT EXISTS(SELECT 1 FROM rental_requests rr WHERE rr.conversation_id=c.id AND rr.status='pending')
 FOR UPDATE OF o
), closed AS (
 UPDATE rental_offers o SET status='countered',responded_at=now() FROM current WHERE o.id=current.id RETURNING o.id
), next_offer AS (
 INSERT INTO rental_offers(conversation_id,unit_id,parent_offer_id,proposed_by,monthly_rent_centavos,security_deposit_centavos,reservation_amount_centavos,reservation_credit,reservation_hours,lease_starts_on,move_in_on,lease_ends_on,note)
 SELECT conversation_id,unit_id,id,$1,$3,$4,$5,$7,$6,$8::date,$9::date,NULLIF($10::text,'')::date,$11 FROM current RETURNING *
), n AS (INSERT INTO rental_notifications(user_id,conversation_id,kind,body,event_key)
 SELECT CASE WHEN current.owner_id=$1 THEN current.renter_id ELSE current.owner_id END,current.conversation_id,'offer','A new counteroffer is ready for your review.','offer-counter:'||next_offer.id
 FROM next_offer JOIN current ON current.conversation_id=next_offer.conversation_id)
 SELECT id FROM next_offer`;

const ACCEPT_OFFER=`WITH target AS MATERIALIZED (
 SELECT o.*,c.owner_id,c.renter_id FROM rental_offers o JOIN rental_conversations c ON c.id=o.conversation_id JOIN rental_units u ON u.id=o.unit_id
 WHERE o.id=$2::uuid AND o.status='pending' AND $1 IN(c.owner_id,c.renter_id) AND o.proposed_by<>$1
  AND NOT EXISTS(SELECT 1 FROM rental_tenancies t WHERE t.conversation_id=c.id AND t.status IN ('invited','reserved','active','ending'))
  AND NOT EXISTS(SELECT 1 FROM rental_reservations r WHERE r.conversation_id=c.id AND r.status IN ('awaiting_payment','proof_submitted','reserved'))
  AND NOT EXISTS(SELECT 1 FROM rental_requests rr WHERE rr.conversation_id=c.id AND rr.status='pending')
 FOR UPDATE OF o,u
), accepted AS (
 UPDATE rental_offers o SET status='accepted',accepted_by=$1,accepted_at=now(),responded_at=now() FROM target WHERE o.id=target.id RETURNING o.id
), deal AS (
 SELECT target.* FROM target JOIN accepted ON accepted.id=target.id
), req AS (
 INSERT INTO rental_requests(conversation_id,unit_id,renter_id,desired_move_in_on,status,owner_note,created_at,decided_at)
 SELECT conversation_id,unit_id,renter_id,move_in_on,'approved','Agreed through HomeTayo offer negotiation',now(),now() FROM deal RETURNING *
), hold AS (
 INSERT INTO rental_reservations(request_id,conversation_id,unit_id,renter_id,owner_id,status,amount_centavos,credit_target,monthly_rent_centavos,security_deposit_centavos,starts_on,move_in_on,lease_ends_on,owner_note,expires_at,confirmed_at)
 SELECT req.id,deal.conversation_id,deal.unit_id,deal.renter_id,deal.owner_id,
  CASE WHEN deal.reservation_amount_centavos>0 THEN 'awaiting_payment' ELSE 'converted' END,
  deal.reservation_amount_centavos,deal.reservation_credit,deal.monthly_rent_centavos,deal.security_deposit_centavos,deal.lease_starts_on,deal.move_in_on,deal.lease_ends_on,
  'Terms accepted through HomeTayo offer negotiation',now()+make_interval(hours=>deal.reservation_hours),CASE WHEN deal.reservation_amount_centavos=0 THEN now() ELSE NULL END
 FROM deal CROSS JOIN req RETURNING *
), tenancy AS (
 INSERT INTO rental_tenancies(conversation_id,unit_id,status,monthly_rent_centavos,security_deposit_centavos,starts_on,lease_ends_on,move_in_on,approved_at)
 SELECT conversation_id,unit_id,'reserved',monthly_rent_centavos,security_deposit_centavos,starts_on,lease_ends_on,move_in_on,now() FROM hold WHERE amount_centavos=0 RETURNING *
), linked_hold AS (
 UPDATE rental_reservations r SET status='reserved',tenancy_id=tenancy.id FROM tenancy WHERE r.id=(SELECT id FROM hold) RETURNING r.id
), linked_request AS (
 UPDATE rental_requests rr SET tenancy_id=tenancy.id FROM tenancy WHERE rr.id=(SELECT id FROM req) RETURNING rr.id
), linked_offer AS (
 UPDATE rental_offers o SET request_id=req.id,reservation_id=hold.id FROM req,hold WHERE o.id=$2::uuid RETURNING o.id
), deposit_charge AS (
 INSERT INTO rent_charges(tenancy_id,due_on,description,amount_centavos,source,charge_kind)
 SELECT tenancy.id,tenancy.starts_on,'Security deposit',tenancy.security_deposit_centavos,'manual','deposit' FROM tenancy WHERE tenancy.security_deposit_centavos>0 RETURNING id
), rent_charge AS (
 INSERT INTO rent_charges(tenancy_id,due_on,description,amount_centavos,source,charge_kind)
 SELECT tenancy.id,tenancy.starts_on,to_char(tenancy.starts_on,'FMMonth YYYY')||' rent',tenancy.monthly_rent_centavos,'manual','rent' FROM tenancy RETURNING id
), counterpart_notice AS (
 INSERT INTO rental_notifications(user_id,conversation_id,kind,body,event_key)
 SELECT CASE WHEN deal.owner_id=$1 THEN deal.renter_id ELSE deal.owner_id END,deal.conversation_id,'offer','Rental offer accepted. The agreed terms are now locked in.','offer-accepted:'||deal.id FROM deal
), renter_notice AS (
 INSERT INTO rental_notifications(user_id,conversation_id,kind,body,event_key)
 SELECT deal.renter_id,deal.conversation_id,'reservation',CASE WHEN deal.reservation_amount_centavos>0
  THEN 'Offer accepted. Complete the reservation payment before the hold expires.' ELSE 'Offer accepted. Your unit is now reserved.' END,'offer-reservation:'||deal.id FROM deal
 ON CONFLICT(event_key) DO NOTHING
)
 SELECT id FROM accepted`;

const DECLINE_OFFER=`WITH target AS MATERIALIZED (
 SELECT o.*,c.owner_id,c.renter_id FROM rental_offers o JOIN rental_conversations c ON c.id=o.conversation_id
 WHERE o.id=$2::uuid AND o.status='pending' AND $1 IN(c.owner_id,c.renter_id) AND o.proposed_by<>$1 FOR UPDATE OF o
), done AS (
 UPDATE rental_offers o SET status='declined',responded_at=now(),note=CASE WHEN $3='' THEN o.note ELSE trim(concat_ws(E'\n',o.note,'Decline note: '||$3)) END
 FROM target WHERE o.id=target.id RETURNING o.*
), n AS (INSERT INTO rental_notifications(user_id,conversation_id,kind,body,event_key)
 SELECT target.proposed_by,target.conversation_id,'offer','Your rental offer was declined.'||CASE WHEN $3='' THEN '' ELSE ' '||$3 END,'offer-declined:'||done.id
 FROM done JOIN target ON target.id=done.id)
 SELECT id FROM done`;

const WITHDRAW_OFFER=`WITH target AS MATERIALIZED (
 SELECT o.*,c.owner_id,c.renter_id FROM rental_offers o JOIN rental_conversations c ON c.id=o.conversation_id
 WHERE o.id=$2::uuid AND o.status='pending' AND o.proposed_by=$1 AND $1 IN(c.owner_id,c.renter_id) FOR UPDATE OF o
), done AS (
 UPDATE rental_offers o SET status='withdrawn',responded_at=now() FROM target WHERE o.id=target.id RETURNING o.*
), n AS (INSERT INTO rental_notifications(user_id,conversation_id,kind,body,event_key)
 SELECT CASE WHEN target.owner_id=$1 THEN target.renter_id ELSE target.owner_id END,target.conversation_id,'offer','The pending rental offer was withdrawn.','offer-withdrawn:'||done.id
 FROM done JOIN target ON target.id=done.id)
 SELECT id FROM done`;

export async function rentalOfferState(userId:string,conversationId:string):Promise<RentalOfferState>{
 try{const rows=await client().query(OFFER_STATE,[userId,conversationId]);return {available:true,offers:rows as RentalOfferState["offers"]};}
 catch{return {available:false,offers:[]};}
}

export async function performRentalOfferAction(userId:string,raw:unknown){
 const v=rentalOfferAction.parse(raw);if(!await consumeRateLimit("rental-offers",userId,40,60))throw Error("Please wait a moment before changing the offer again.");
 let query="",args:unknown[]=[];
 switch(v.action){
  case "makeOffer":query=MAKE_OFFER;args=[userId,v.conversationId,v.unitId,v.monthlyRent,v.moveInOn,v.note];break;
  case "counterOffer":query=COUNTER_OFFER;args=[userId,v.offerId,v.monthlyRent,v.securityDeposit,v.reservationAmount,v.reservationHours,v.reservationCredit,v.leaseStartsOn,v.moveInOn,v.leaseEndsOn||"",v.note];break;
  case "acceptOffer":query=ACCEPT_OFFER;args=[userId,v.offerId];break;
  case "declineOffer":query=DECLINE_OFFER;args=[userId,v.offerId,v.reason];break;
  case "withdrawOffer":query=WITHDRAW_OFFER;args=[userId,v.offerId];break;
 }
 let rows:Array<{id:string}>;try{rows=await client().query(query,args) as Array<{id:string}>;}catch(error){if(error instanceof Error&&/rental_offers|does not exist/i.test(error.message))throw Error("Offer negotiation is being enabled. Try again after the latest update.");throw error;}
 if(!rows.length)throw Error("That offer can no longer be changed. Refresh and check the latest terms or unit availability.");
 await dispatchPendingRentalPushes();
 const messages:Record<RentalOfferAction["action"],string>={makeOffer:"Offer sent to the owner.",counterOffer:"Counteroffer sent.",acceptOffer:"Offer accepted. The agreed terms are now in the reservation flow.",declineOffer:"Offer declined.",withdrawOffer:"Offer withdrawn."};
 return {id:rows[0].id,message:messages[v.action]};
}
