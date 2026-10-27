import {strict as assert} from "node:assert";
import fs from "node:fs";
import {describe,it} from "node:test";
import {PGlite} from "@electric-sql/pglite";

const migration=fs.readFileSync("db/migrations/016_rental_offer_negotiation.sql","utf8");
const service=fs.readFileSync("lib/rental-offers.ts","utf8");
const acceptService=fs.readFileSync("lib/rental-offer-service.ts","utf8");
const lifecycle=fs.readFileSync("lib/rental-lifecycle.ts","utf8");
const lifecycleCompat=fs.readFileSync("lib/rental-lifecycle-compat.ts","utf8");
const proofService=fs.readFileSync("lib/rental-reservation-proof.ts","utf8");
const web=fs.readFileSync("components/rental-negotiation.tsx","utf8");
const native=fs.readFileSync("apps/mobile/src/chat-rental-offer.tsx","utf8");
const messenger=fs.readFileSync("apps/mobile/src/messenger-workspace.tsx","utf8");
const rentalCenterShell=fs.readFileSync("apps/mobile/src/rental-center-shell.tsx","utf8");
const migrations=["001_core.sql","002_profiles_admin_activity.sql","003_email_accounts.sql","004_native_sessions_locations.sql","005_rental_units.sql","006_rental_operations.sql","007_profile_photo.sql","008_social_safety.sql","009_platform_announcements.sql","010_realtime_messaging_push.sql","011_rental_lifecycle.sql","012_rental_lifecycle_trigger_fix.sql","013_marketplace_listing_purpose.sql","014_reservations_payment_proofs.sql","015_profile_avatar.sql","016_rental_offer_negotiation.sql"];

function query(source:string,name:string){
 const match=source.match(new RegExp(`(?:const|export const) ${name}=\\\`([\\s\\S]*?)\\\`;`));
 assert.ok(match?.[1],`Missing ${name} SQL`);
 return match[1];
}

describe("rental offer negotiation",()=>{
 it("keeps one live offer per conversation and preserves counter history",()=>{
  assert.match(migration,/CREATE TABLE rental_offers/);
  assert.match(migration,/WHERE status='pending'/);
  assert.match(migration,/parent_offer_id/);
  assert.match(service,/'countered'/);
  assert.match(service,/UPDATE rental_offers o SET parent_offer_id=archived\.id/);
 });
 it("turns accepted terms into the existing reservation workflow",()=>{
  assert.match(acceptService,/INSERT INTO rental_requests/);
  assert.match(acceptService,/INSERT INTO rental_reservations/);
  assert.match(acceptService,/INSERT INTO rental_tenancies/);
  assert.match(acceptService,/CASE WHEN deal\.reservation_amount_centavos>0 THEN 'awaiting_payment' ELSE 'converted'/);
  assert.match(acceptService,/FROM accepted_offer/);
 });
 it("supports accept, counter, decline and withdraw on web and Android",()=>{
  for(const source of [web,native]){
   assert.match(source,/acceptOffer/);
   assert.match(source,/counterOffer/);
   assert.match(source,/declineOffer/);
   assert.match(source,/withdrawOffer/);
  }
 });
 it("keeps Android negotiation inside the chat thread instead of Rental Center",()=>{
  assert.match(messenger,/import \{ChatRentalOffer\} from "\.\/chat-rental-offer"/);
  assert.match(messenger,/<ChatRentalOffer conversationId=\{selected\}/);
  assert.doesNotMatch(rentalCenterShell,/RentalNegotiation|offers|Offers/);
 });
 it("executes one complete negotiated rental from offer through review",async()=>{
  const db=new PGlite();
  try{
   for(const file of migrations)await db.exec(fs.readFileSync(new URL(`../../db/migrations/${file}`,import.meta.url),"utf8"));
   await db.exec(`
    INSERT INTO users(id,email,display_name,role) VALUES
     ('owner','offer-owner@test.invalid','Offer Owner','landlord'),
     ('renter','offer-renter@test.invalid','Offer Renter','renter');
    INSERT INTO owner_profiles(user_id,public_name) VALUES('owner','Offer Owner');
   `);
   const listing="00000000-0000-4000-8000-000000000301";
   await db.query(`INSERT INTO listings(id,owner_id,slug,title,description,property_type,status,city,barangay,monthly_rent_centavos,published_at,last_confirmed_at)
    SELECT $1::uuid,id,'offer-home','Offer home','Negotiation test','apartment','published','Test','Test',600000,now(),now() FROM owner_profiles WHERE user_id='owner'`,[listing]);
   const unit=(await db.query<{id:string}>(`INSERT INTO rental_units(listing_id,label,status,monthly_rent_centavos,capacity) VALUES($1::uuid,'Room 1','available',600000,1) RETURNING id`,[listing])).rows[0].id;
   const conversation=(await db.query<{id:string}>(`INSERT INTO rental_conversations(listing_id,owner_id,renter_id) VALUES($1::uuid,'owner','renter') RETURNING id`,[listing])).rows[0].id;

   const first=(await db.query<{id:string}>(query(service,"MAKE_OFFER"),['renter',conversation,unit,550000,'2026-11-15','I can move in mid-month.'])).rows[0];
   assert.ok(first?.id);
   const counter=(await db.query<{id:string}>(query(service,"COUNTER_OFFER"),['owner',first.id,575000,575000,100000,48,'first_rent','2026-11-15','2026-11-15','', 'Meet me halfway at 5,750.'])).rows[0];
   assert.ok(counter?.id);
   const accepted=(await db.query<{id:string}>(query(acceptService,"ACCEPT_OFFER_V2"),['renter',counter.id])).rows[0];
   assert.equal(accepted.id,counter.id);

   const offer=(await db.query<{status:string;request_id:string;reservation_id:string}>(`SELECT status,request_id,reservation_id FROM rental_offers WHERE id=$1::uuid`,[counter.id])).rows[0];
   assert.equal(offer.status,"accepted");assert.ok(offer.request_id);assert.ok(offer.reservation_id);
   assert.equal((await db.query<{status:string}>(`SELECT status FROM rental_requests WHERE id=$1::uuid`,[offer.request_id])).rows[0].status,"approved");
   const reservation=(await db.query<{status:string;amount_centavos:number;monthly_rent_centavos:number}>(`SELECT status,amount_centavos,monthly_rent_centavos FROM rental_reservations WHERE id=$1::uuid`,[offer.reservation_id])).rows[0];
   assert.equal(reservation.status,"awaiting_payment");assert.equal(Number(reservation.amount_centavos),100000);assert.equal(Number(reservation.monthly_rent_centavos),575000);
   assert.equal((await db.query<{status:string}>(`SELECT status FROM rental_units WHERE id=$1::uuid`,[unit])).rows[0].status,"reserved");
   const archived=(await db.query<{status:string;monthly_rent_centavos:number}>(`SELECT status,monthly_rent_centavos FROM rental_offers WHERE conversation_id=$1::uuid AND id<>$2::uuid ORDER BY created_at DESC LIMIT 1`,[conversation,counter.id])).rows[0];
   assert.equal(archived.status,"countered");assert.equal(Number(archived.monthly_rent_centavos),550000);

   const submittedReservation=(await db.query<{id:string}>(query(proofService,"SUBMIT_RESERVATION_PROOF_TYPED"),['renter',offer.reservation_id,'gcash','https://example.com/reservation.jpg','GCASH-RES-1'])).rows[0];
   assert.equal(submittedReservation.id,offer.reservation_id);
   const tenancyId="00000000-0000-4000-8000-000000000302";
   const confirmedReservation=(await db.query<{id:string}>(query(proofService,"CONFIRM_RESERVATION_TYPED"),['owner',offer.reservation_id,tenancyId])).rows[0];
   assert.equal(confirmedReservation.id,offer.reservation_id);
   const linked=(await db.query<{status:string;tenancy_id:string}>(`SELECT status,tenancy_id FROM rental_reservations WHERE id=$1::uuid`,[offer.reservation_id])).rows[0];
   assert.equal(linked.status,"reserved");assert.equal(linked.tenancy_id,tenancyId);

   assert.ok((await db.query<{id:string}>(query(lifecycle,"ACTIVATE_TENANCY"),['owner',linked.tenancy_id])).rows[0]?.id);
   assert.equal((await db.query<{status:string}>(`SELECT status FROM rental_units WHERE id=$1::uuid`,[unit])).rows[0].status,"occupied");

   const rentCharge=(await db.query<{id:string;balance:number}>(`SELECT r.id,(r.amount_centavos-COALESCE(sum(p.amount_centavos) FILTER(WHERE p.voided_at IS NULL),0))::int AS balance
    FROM rent_charges r LEFT JOIN rent_payments p ON p.charge_id=r.id WHERE r.tenancy_id=$1::uuid AND r.charge_kind='rent' GROUP BY r.id LIMIT 1`,[linked.tenancy_id])).rows[0];
   assert.equal(Number(rentCharge.balance),475000);
   const paymentSubmission=(await db.query<{id:string}>(query(proofService,"SUBMIT_PAYMENT_PROOF_TYPED"),['renter',rentCharge.id,475000,'2026-11-15','gcash','https://example.com/rent.jpg','GCASH-RENT-1','November rent'])).rows[0];
   assert.ok(paymentSubmission?.id);
   assert.ok((await db.query<{id:string}>(query(proofService,"CONFIRM_PAYMENT_PROOF_TYPED"),['owner',paymentSubmission.id])).rows[0]?.id);
   const paid=(await db.query<{paid:number}>(`SELECT COALESCE(sum(amount_centavos),0)::int AS paid FROM rent_payments WHERE charge_id=$1::uuid AND voided_at IS NULL`,[rentCharge.id])).rows[0];
   assert.equal(Number(paid.paid),575000);

   const maintenance=(await db.query<{id:string}>(query(lifecycle,"MAINTENANCE_CREATE"),['renter',linked.tenancy_id,'Leaking faucet','Kitchen faucet is leaking','normal','https://example.com/leak.jpg'])).rows[0];
   assert.ok(maintenance?.id);
   assert.ok((await db.query<{id:string}>(query(lifecycle,"MAINTENANCE_STATUS"),['owner',maintenance.id,'resolved'])).rows[0]?.id);
   const document=(await db.query<{id:string}>(query(lifecycle,"DOCUMENT_ADD"),['owner',linked.tenancy_id,'lease','Signed lease','https://example.com/lease.pdf'])).rows[0];
   assert.ok(document?.id);

   assert.ok((await db.query<{id:string}>(query(lifecycle,"REQUEST_MOVE_OUT"),['renter',linked.tenancy_id,'2026-12-15'])).rows[0]?.id);
   assert.ok((await db.query<{id:string}>(query(lifecycleCompat,"END_TENANCY_V2"),['owner',linked.tenancy_id,'2026-12-15'])).rows[0]?.id);
   assert.equal((await db.query<{status:string}>(`SELECT status FROM rental_units WHERE id=$1::uuid`,[unit])).rows[0].status,"available");
   const review=(await db.query<{id:string}>(query(lifecycle,"REVIEW"),['renter',linked.tenancy_id,'property',5,'Great stay'])).rows[0];
   assert.ok(review?.id);
   assert.equal((await db.query<{status:string}>(`SELECT status FROM rental_tenancies WHERE id=$1::uuid`,[linked.tenancy_id])).rows[0].status,"ended");
  }finally{await db.close();}
 });
});