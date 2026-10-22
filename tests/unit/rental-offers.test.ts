import {strict as assert} from "node:assert";
import fs from "node:fs";
import {describe,it} from "node:test";
import {PGlite} from "@electric-sql/pglite";

const migration=fs.readFileSync("db/migrations/016_rental_offer_negotiation.sql","utf8");
const service=fs.readFileSync("lib/rental-offers.ts","utf8");
const web=fs.readFileSync("components/rental-negotiation.tsx","utf8");
const native=fs.readFileSync("apps/mobile/src/rental-negotiation.tsx","utf8");
const migrations=["001_core.sql","002_profiles_admin_activity.sql","003_email_accounts.sql","004_native_sessions_locations.sql","005_rental_units.sql","006_rental_operations.sql","007_profile_photo.sql","008_social_safety.sql","009_platform_announcements.sql","010_realtime_messaging_push.sql","011_rental_lifecycle.sql","012_rental_lifecycle_trigger_fix.sql","013_marketplace_listing_purpose.sql","014_reservations_payment_proofs.sql","015_profile_avatar.sql","016_rental_offer_negotiation.sql"];

function query(name:string){
 const match=service.match(new RegExp(`const ${name}=\\\`([\\s\\S]*?)\\\`;`));
 assert.ok(match?.[1],`Missing ${name} SQL`);
 return match[1];
}

describe("rental offer negotiation",()=>{
 it("keeps one live offer per conversation and preserves counter history",()=>{
  assert.match(migration,/CREATE TABLE rental_offers/);
  assert.match(migration,/WHERE status='pending'/);
  assert.match(migration,/parent_offer_id/);
  assert.match(service,/status='countered'/);
 });
 it("turns accepted terms into the existing reservation workflow",()=>{
  assert.match(service,/INSERT INTO rental_requests/);
  assert.match(service,/INSERT INTO rental_reservations/);
  assert.match(service,/INSERT INTO rental_tenancies/);
  assert.match(service,/CASE WHEN deal\.reservation_amount_centavos>0 THEN 'awaiting_payment' ELSE 'converted'/);
 });
 it("supports accept, counter, decline and withdraw on web and Android",()=>{
  for(const source of [web,native]){
   assert.match(source,/acceptOffer/);
   assert.match(source,/counterOffer/);
   assert.match(source,/declineOffer/);
   assert.match(source,/withdrawOffer/);
  }
 });
 it("executes renter offer, owner counter and renter acceptance into a reservation",async()=>{
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

   const first=(await db.query<{id:string}>(query("MAKE_OFFER"),['renter',conversation,unit,550000,'2026-11-15','I can move in mid-month.'])).rows[0];
   assert.ok(first?.id);
   const counter=(await db.query<{id:string}>(query("COUNTER_OFFER"),['owner',first.id,575000,575000,100000,48,'first_rent','2026-11-15','2026-11-15','', 'Meet me halfway at 5,750.'])).rows[0];
   assert.ok(counter?.id);
   const accepted=(await db.query<{id:string}>(query("ACCEPT_OFFER"),['renter',counter.id])).rows[0];
   assert.equal(accepted.id,counter.id);

   const offer=(await db.query<{status:string;request_id:string;reservation_id:string}>(`SELECT status,request_id,reservation_id FROM rental_offers WHERE id=$1::uuid`,[counter.id])).rows[0];
   assert.equal(offer.status,"accepted");assert.ok(offer.request_id);assert.ok(offer.reservation_id);
   const request=(await db.query<{status:string}>(`SELECT status FROM rental_requests WHERE id=$1::uuid`,[offer.request_id])).rows[0];
   assert.equal(request.status,"approved");
   const reservation=(await db.query<{status:string;amount_centavos:number;monthly_rent_centavos:number}>(`SELECT status,amount_centavos,monthly_rent_centavos FROM rental_reservations WHERE id=$1::uuid`,[offer.reservation_id])).rows[0];
   assert.equal(reservation.status,"awaiting_payment");assert.equal(Number(reservation.amount_centavos),100000);assert.equal(Number(reservation.monthly_rent_centavos),575000);
   const room=(await db.query<{status:string}>(`SELECT status FROM rental_units WHERE id=$1::uuid`,[unit])).rows[0];
   assert.equal(room.status,"reserved");
  }finally{await db.close();}
 });
});
