import {test} from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {PGlite} from "@electric-sql/pglite";
import {PUBLISH_OWNER_RENTAL,UPDATE_OWNER_PIN} from "../../lib/native-listing-policy.ts";
import {SAVE_PHOTOS} from "../../lib/rental-photo-input.ts";
import {PgDialect} from "drizzle-orm/pg-core";
import * as drizzle from "drizzle-orm";
import ts from "typescript";

test("owner publication sets required timestamps and cannot publish another owner's or moderated rental",async()=>{
 const db=new PGlite();
 try{
  for(const name of ["001_core.sql","002_profiles_admin_activity.sql","003_email_accounts.sql","004_native_sessions_locations.sql","013_marketplace_listing_purpose.sql"])await db.exec(readFileSync(new URL(`../../db/migrations/${name}`,import.meta.url),"utf8"));
  await db.exec("INSERT INTO users(id,email,role) VALUES('owner','owner@example.test','landlord'),('other','other@example.test','landlord');INSERT INTO owner_profiles(user_id,public_name) VALUES('owner','Test owner');");
  const source=readFileSync(new URL("../../app/api/mobile/listings/route.ts",import.meta.url),"utf8");
  const match=source.match(/db\.query\(`(WITH created AS \([\s\S]*?)`,\[id,slug/);assert.ok(match);
  const id="00000000-0000-4000-8000-000000000001";
  await db.query(match[1],[id,"local-test","Local test apartment","Synthetic local fixture only","apartment","rent",null,"whole_unit","Test City","Test area",7,125,800000,1,1,1,"partial","none",null,"owner","Test Province"]);
  const status=async()=> (await db.query<{status:string;published_at:unknown;last_confirmed_at:unknown}>("SELECT status,published_at,last_confirmed_at FROM listings WHERE id=$1",[id])).rows[0];
  assert.equal((await status()).status,"published");assert.ok((await status()).published_at);assert.ok((await status()).last_confirmed_at);
  await db.query(UPDATE_OWNER_PIN,[7.1,125.1,"owner",id]);assert.equal((await status()).status,"published");
  await db.query(SAVE_PHOTOS,[id,"owner",JSON.stringify(["https://example.test/local.jpg"])]);assert.equal((await status()).status,"published");
  await db.query("UPDATE listings SET status='pending_review',published_at=NULL WHERE id=$1",[id]);
  assert.equal((await db.query(PUBLISH_OWNER_RENTAL,["other",id])).rows.length,0);
  assert.equal((await db.query(PUBLISH_OWNER_RENTAL,["owner",id])).rows.length,1);assert.equal((await status()).status,"published");
  for(const blocked of ["removed","rejected"]){
   await db.query("UPDATE listings SET status=$1 WHERE id=$2",[blocked,id]);
   assert.equal((await db.query(PUBLISH_OWNER_RENTAL,["owner",id])).rows.length,0);
   assert.equal((await db.query(UPDATE_OWNER_PIN,[7,125,"owner",id])).rows.length,0);
   await db.query(SAVE_PHOTOS,[id,"owner","[]"]);assert.equal((await status()).status,blocked);
  }
  await db.query("UPDATE listings SET status='published' WHERE id=$1",[id]);
  await db.exec("INSERT INTO users(id,email,role) VALUES('admin','admin@example.test','renter')");
  const code=ts.transpileModule(readFileSync(new URL("../../app/admin/actions.ts",import.meta.url),"utf8"),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText;
  const actions:Record<string,(form:FormData)=>Promise<void>>={};
  new Function("require","exports",code)((name:string)=>({
    "@/lib/admin-owner":{canAdminister:()=>true},"drizzle-orm":drizzle,
    "next/cache":{revalidatePath:()=>{}},"next/navigation":{redirect:()=>{throw Error("REDIRECT");}},
    "@/lib/session-user":{requireAccount:async()=>({id:"admin"})},
    "@/lib/db":{getDatabase:()=>({execute:async(statement:Parameters<PgDialect["sqlToQuery"]>[0])=>{const q=new PgDialect().sqlToQuery(statement);return db.query(q.sql,q.params);}})},
  }[name]),actions);
  const form=new FormData();form.set("id",id);form.set("decision","removed");form.set("reason","Local moderation test");
  await assert.rejects(actions.reviewProperty(form),/REDIRECT/);
  assert.equal((await status()).status,"removed");
  assert.equal((await db.query<{decision:string}>("SELECT decision FROM listing_reviews WHERE listing_id=$1",[id])).rows[0].decision,"removed");
  assert.equal((await db.query(PUBLISH_OWNER_RENTAL,["owner",id])).rows.length,0);
 }finally{await db.close();}
});
