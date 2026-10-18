import {test} from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {PGlite} from "@electric-sql/pglite";
import {INQUIRE} from "../../lib/rental-operation-sql.ts";
import {MESSAGE_V2,MESSAGE_REACT,THREAD_MESSAGES_SOCIAL} from "../../lib/rental-social-sql.ts";

test("social safety migration supports replies reactions reports and account moderation",async()=>{
 const db=new PGlite();
 try{
  for(const file of ["001_core.sql","002_profiles_admin_activity.sql","003_email_accounts.sql","004_native_sessions_locations.sql","005_rental_units.sql","006_rental_operations.sql","007_profile_photo.sql","008_social_safety.sql"]){
   await db.exec(readFileSync(new URL(`../../db/migrations/${file}`,import.meta.url),"utf8"));
  }
  await db.exec("INSERT INTO users(id,email,display_name,role) VALUES('owner','owner@test.invalid','Owner','landlord'),('renter','renter@test.invalid','Renter','renter'); INSERT INTO owner_profiles(user_id,public_name) VALUES('owner','Owner');");
  const listing="00000000-0000-4000-8000-000000000001";
  await db.query(`INSERT INTO listings(id,owner_id,slug,title,description,property_type,status,city,barangay,monthly_rent_centavos,published_at,last_confirmed_at) SELECT $1::uuid,id,'social-home','Social home','Test rental only','apartment','published','Test','Test',500000,now(),now() FROM owner_profiles WHERE user_id='owner'`,[listing]);
  const thread=(await db.query<{id:string}>(INQUIRE,["renter","social-home"])).rows[0].id;
  const first="10000000-0000-4000-8000-000000000001",reply="10000000-0000-4000-8000-000000000002";
  assert.equal((await db.query(MESSAGE_V2,["renter",thread,first,"Hello",null,"text"])).rows.length,1);
  assert.equal((await db.query(MESSAGE_V2,["owner",thread,reply,"Hi there",first,"text"])).rows.length,1);
  assert.equal((await db.query(MESSAGE_REACT,["renter",reply,"❤️"])).rows.length,1);
  const messages=(await db.query<{replyToId:string|null;replyBody:string|null;reactions:Array<{emoji:string;count:number;mine:boolean}>}>(THREAD_MESSAGES_SOCIAL,["renter",thread,null])).rows;
  const replied=messages.find(message=>message.replyToId===first);assert.equal(replied?.replyBody,"Hello");assert.ok(replied?.reactions.some(reaction=>reaction.emoji==="❤️"&&reaction.count===1&&reaction.mine));
  await db.query(`INSERT INTO safety_reports(reporter_id,target_user_id,listing_id,message_id,category,details) VALUES($1,$2,$3::uuid,$4::uuid,'inappropriate_message','Test report')`,["renter","owner",listing,reply]);
  assert.equal((await db.query<{count:number}>("SELECT count(*)::int AS count FROM safety_reports WHERE status='open'")).rows[0].count,1);
  assert.equal((await db.query<{account_status:string}>("SELECT account_status FROM users WHERE id='owner'")).rows[0].account_status,"active");
  await db.query("UPDATE users SET account_status='banned' WHERE id='owner'");
  assert.equal((await db.query<{account_status:string}>("SELECT account_status FROM users WHERE id='owner'")).rows[0].account_status,"banned");
 }finally{await db.close();}
});
