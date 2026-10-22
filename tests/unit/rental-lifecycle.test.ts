import {test} from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {PGlite} from "@electric-sql/pglite";
import {rentalOperation} from "../../lib/rental-operation-input.ts";

const migrations=["001_core.sql","002_profiles_admin_activity.sql","003_email_accounts.sql","004_native_sessions_locations.sql","005_rental_units.sql","006_rental_operations.sql","007_profile_photo.sql","008_social_safety.sql","009_platform_announcements.sql","010_realtime_messaging_push.sql","011_rental_lifecycle.sql","012_rental_lifecycle_trigger_fix.sql","013_marketplace_listing_purpose.sql","014_reservations_payment_proofs.sql","015_profile_avatar.sql","016_rental_offer_negotiation.sql"];

test("new lifecycle input validates request, transaction, maintenance, document and review actions",()=>{
 const conversationId="00000000-0000-4000-8000-000000000010",unitId="00000000-0000-4000-8000-000000000020",tenancyId="00000000-0000-4000-8000-000000000030",reservationId="00000000-0000-4000-8000-000000000040",chargeId="00000000-0000-4000-8000-000000000050";
 assert.equal(rentalOperation.safeParse({action:"requestRent",conversationId,unitId,desiredMoveInOn:"2026-11-01"}).success,true);
 assert.equal(rentalOperation.safeParse({action:"submitReservationProof",reservationId,paymentMethod:"gcash",proofUrl:"https://example.com/proof.jpg",paymentReference:"ABC123"}).success,true);
 assert.equal(rentalOperation.safeParse({action:"submitPaymentProof",chargeId,amount:"6000",paidOn:"2026-11-01",paymentMethod:"bank",proofUrl:"https://example.com/rent.jpg",paymentReference:"TX-1"}).success,true);
 assert.equal(rentalOperation.safeParse({action:"maintenanceCreate",tenancyId,title:"Leak",description:"Kitchen faucet is leaking",priority:"urgent",photoUrl:"https://example.com/leak.jpg"}).success,true);
 assert.equal(rentalOperation.safeParse({action:"documentAdd",tenancyId,kind:"lease",label:"Signed lease",url:"https://example.com/lease.pdf"}).success,true);
 assert.equal(rentalOperation.safeParse({action:"review",tenancyId,targetType:"property",rating:5,body:"Good stay"}).success,true);
 assert.equal(rentalOperation.safeParse({action:"review",tenancyId,targetType:"property",rating:6,body:"Invalid"}).success,false);
 assert.equal(rentalOperation.safeParse({action:"documentAdd",tenancyId,kind:"lease",label:"Unsafe",url:"javascript:alert(1)"}).success,false);
});

test("reservation holds consume capacity and reserved tenancy keeps the unit reserved",async()=>{
 const db=new PGlite();
 try{
  for(const file of migrations)await db.exec(readFileSync(new URL(`../../db/migrations/${file}`,import.meta.url),"utf8"));
  await db.exec(`
   INSERT INTO users(id,email,display_name,role) VALUES
    ('owner','owner@test.invalid','Owner','landlord'),
    ('renter1','r1@test.invalid','Renter One','renter'),
    ('renter2','r2@test.invalid','Renter Two','renter');
   INSERT INTO owner_profiles(user_id,public_name) VALUES('owner','Owner');
  `);
  const listing="00000000-0000-4000-8000-000000000101";
  await db.query(`INSERT INTO listings(id,owner_id,slug,title,description,property_type,status,city,barangay,monthly_rent_centavos,published_at,last_confirmed_at)
   SELECT $1::uuid,id,'reservation-home','Reservation home','Lifecycle test','boarding_house','published','Test','Test',600000,now(),now() FROM owner_profiles WHERE user_id='owner'`,[listing]);
  const unit=(await db.query<{id:string}>(`INSERT INTO rental_units(listing_id,label,status,monthly_rent_centavos,capacity) VALUES($1::uuid,'Room 1','available',600000,1) RETURNING id`,[listing])).rows[0].id;
  const c1=(await db.query<{id:string}>(`INSERT INTO rental_conversations(listing_id,owner_id,renter_id) VALUES($1::uuid,'owner','renter1') RETURNING id`,[listing])).rows[0].id;
  const c2=(await db.query<{id:string}>(`INSERT INTO rental_conversations(listing_id,owner_id,renter_id) VALUES($1::uuid,'owner','renter2') RETURNING id`,[listing])).rows[0].id;
  const req1=(await db.query<{id:string}>(`INSERT INTO rental_requests(conversation_id,unit_id,renter_id,desired_move_in_on,status) VALUES($1::uuid,$2::uuid,'renter1','2026-11-01','approved') RETURNING id`,[c1,unit])).rows[0].id;
  const hold=(await db.query<{id:string}>(`INSERT INTO rental_reservations(request_id,conversation_id,unit_id,renter_id,owner_id,amount_centavos,monthly_rent_centavos,security_deposit_centavos,starts_on,move_in_on,expires_at)
   VALUES($1::uuid,$2::uuid,$3::uuid,'renter1','owner',200000,600000,600000,'2026-11-01','2026-11-01',now()+interval '48 hours') RETURNING id`,[req1,c1,unit])).rows[0].id;
  assert.equal((await db.query<{status:string}>(`SELECT status FROM rental_units WHERE id=$1::uuid`,[unit])).rows[0].status,"reserved");
  const req2=(await db.query<{id:string}>(`INSERT INTO rental_requests(conversation_id,unit_id,renter_id,desired_move_in_on,status) VALUES($1::uuid,$2::uuid,'renter2','2026-11-01','approved') RETURNING id`,[c2,unit])).rows[0].id;
  await assert.rejects(db.query(`INSERT INTO rental_reservations(request_id,conversation_id,unit_id,renter_id,owner_id,amount_centavos,monthly_rent_centavos,starts_on,move_in_on,expires_at)
   VALUES($1::uuid,$2::uuid,$3::uuid,'renter2','owner',100000,600000,'2026-11-01','2026-11-01',now()+interval '48 hours')`,[req2,c2,unit]),/capacity/i);
  await db.query(`UPDATE rental_reservations SET status='converted' WHERE id=$1::uuid`,[hold]);
  const tenancy=(await db.query<{id:string}>(`INSERT INTO rental_tenancies(conversation_id,unit_id,status,monthly_rent_centavos,security_deposit_centavos,starts_on,move_in_on,approved_at)
   VALUES($1::uuid,$2::uuid,'reserved',600000,600000,'2026-11-01','2026-11-01',now()) RETURNING id`,[c1,unit])).rows[0].id;
  await db.query(`UPDATE rental_reservations SET status='reserved',tenancy_id=$2::uuid WHERE id=$1::uuid`,[hold,tenancy]);
  assert.equal((await db.query<{status:string}>(`SELECT status FROM rental_units WHERE id=$1::uuid`,[unit])).rows[0].status,"reserved");
  await db.query(`UPDATE rental_tenancies SET status='active' WHERE id=$1::uuid`,[tenancy]);
  assert.equal((await db.query<{status:string}>(`SELECT status FROM rental_units WHERE id=$1::uuid`,[unit])).rows[0].status,"occupied");
 }finally{await db.close();}
});

test("unit capacity blocks overbooking and occupancy follows tenancy status",async()=>{
 const db=new PGlite();
 try{
  for(const file of migrations)await db.exec(readFileSync(new URL(`../../db/migrations/${file}`,import.meta.url),"utf8"));
  await db.exec(`
   INSERT INTO users(id,email,display_name,role) VALUES
    ('owner','owner@test.invalid','Owner','landlord'),
    ('renter1','r1@test.invalid','Renter One','renter'),
    ('renter2','r2@test.invalid','Renter Two','renter');
   INSERT INTO owner_profiles(user_id,public_name) VALUES('owner','Owner');
  `);
  const listing="00000000-0000-4000-8000-000000000201";
  await db.query(`INSERT INTO listings(id,owner_id,slug,title,description,property_type,status,city,barangay,monthly_rent_centavos,published_at,last_confirmed_at)
   SELECT $1::uuid,id,'capacity-home','Capacity home','Lifecycle test','boarding_house','published','Test','Test',600000,now(),now() FROM owner_profiles WHERE user_id='owner'`,[listing]);
  const unit=(await db.query<{id:string}>(`INSERT INTO rental_units(listing_id,label,status,monthly_rent_centavos,capacity) VALUES($1::uuid,'Room 1','available',600000,1) RETURNING id`,[listing])).rows[0].id;
  const c1=(await db.query<{id:string}>(`INSERT INTO rental_conversations(listing_id,owner_id,renter_id) VALUES($1::uuid,'owner','renter1') RETURNING id`,[listing])).rows[0].id;
  const c2=(await db.query<{id:string}>(`INSERT INTO rental_conversations(listing_id,owner_id,renter_id) VALUES($1::uuid,'owner','renter2') RETURNING id`,[listing])).rows[0].id;
  const t1=(await db.query<{id:string}>(`INSERT INTO rental_tenancies(conversation_id,unit_id,status,monthly_rent_centavos,security_deposit_centavos,starts_on,move_in_on,approved_at)
   VALUES($1::uuid,$2::uuid,'active',600000,600000,'2026-11-01','2026-11-01',now()) RETURNING id`,[c1,unit])).rows[0].id;
  assert.equal((await db.query<{status:string}>(`SELECT status FROM rental_units WHERE id=$1::uuid`,[unit])).rows[0].status,"occupied");
  await assert.rejects(db.query(`INSERT INTO rental_tenancies(conversation_id,unit_id,status,monthly_rent_centavos,starts_on) VALUES($1::uuid,$2::uuid,'active',600000,'2026-11-01')`,[c2,unit]),/capacity/i);
  await db.query(`UPDATE rental_tenancies SET status='ending',ending_on='2026-12-01' WHERE id=$1::uuid`,[t1]);
  assert.equal((await db.query<{status:string}>(`SELECT status FROM rental_units WHERE id=$1::uuid`,[unit])).rows[0].status,"occupied");
  await db.query(`UPDATE rental_tenancies SET status='ended',ended_on='2026-12-01' WHERE id=$1::uuid`,[t1]);
  assert.equal((await db.query<{status:string}>(`SELECT status FROM rental_units WHERE id=$1::uuid`,[unit])).rows[0].status,"available");
  await db.query(`INSERT INTO rental_tenancies(conversation_id,unit_id,status,monthly_rent_centavos,starts_on,move_in_on) VALUES($1::uuid,$2::uuid,'active',600000,'2026-12-02','2026-12-02')`,[c2,unit]);
  assert.equal((await db.query<{status:string}>(`SELECT status FROM rental_units WHERE id=$1::uuid`,[unit])).rows[0].status,"occupied");
 }finally{await db.close();}
});

test("marketplace migration keeps old listings as rentals and supports sale prices",async()=>{
 const db=new PGlite();
 try{
  for(const file of migrations)await db.exec(readFileSync(new URL(`../../db/migrations/${file}`,import.meta.url),"utf8"));
  await db.exec("INSERT INTO users(id,email,display_name,role) VALUES('owner','market@test.invalid','Owner','landlord'); INSERT INTO owner_profiles(user_id,public_name) VALUES('owner','Owner');");
  const owner=(await db.query<{id:string}>("SELECT id FROM owner_profiles WHERE user_id='owner'")).rows[0].id;
  await db.query(`INSERT INTO listings(owner_id,slug,title,description,property_type,status,city,barangay,monthly_rent_centavos,published_at,last_confirmed_at) VALUES($1::uuid,'old-rental','Old rental','Existing rental remains rental','house','published','Test','Test',500000,now(),now())`,[owner]);
  const old=(await db.query<{listing_purpose:string;sale_price_centavos:number|null}>("SELECT listing_purpose,sale_price_centavos FROM listings WHERE slug='old-rental'")).rows[0];
  assert.equal(old.listing_purpose,"rent");assert.equal(old.sale_price_centavos,null);
  await db.query(`INSERT INTO listings(owner_id,slug,title,description,property_type,listing_purpose,sale_price_centavos,status,city,barangay,monthly_rent_centavos,published_at,last_confirmed_at) VALUES($1::uuid,'sale-home','Sale home','Property offered for purchase','house','sale',250000000,'published','Test','Test',0,now(),now())`,[owner]);
  const sale=(await db.query<{listing_purpose:string;sale_price_centavos:number}>("SELECT listing_purpose,sale_price_centavos FROM listings WHERE slug='sale-home'")).rows[0];
  assert.equal(sale.listing_purpose,"sale");assert.equal(Number(sale.sale_price_centavos),250000000);
  await assert.rejects(db.query(`INSERT INTO listings(owner_id,slug,title,description,property_type,listing_purpose,status,city,barangay,monthly_rent_centavos,published_at,last_confirmed_at) VALUES($1::uuid,'bad-sale','Bad sale','Missing sale price','house','sale','published','Test','Test',0,now(),now())`,[owner]));
 }finally{await db.close();}
});