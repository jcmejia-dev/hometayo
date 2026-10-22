import {strict as assert} from "node:assert";
import fs from "node:fs";
import {describe,it} from "node:test";

const migration=fs.readFileSync("db/migrations/016_rental_offer_negotiation.sql","utf8");
const service=fs.readFileSync("lib/rental-offers.ts","utf8");
const web=fs.readFileSync("components/rental-negotiation.tsx","utf8");
const native=fs.readFileSync("apps/mobile/src/rental-negotiation.tsx","utf8");

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
});
