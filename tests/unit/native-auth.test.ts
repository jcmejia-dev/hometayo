import {test} from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {PGlite} from "@electric-sql/pglite";
import {nativeAuthInput,SESSION_LOOKUP,ROLE_SELECTION} from "../../lib/native-auth-input.ts";
import {UPDATE_OWNER_PIN} from "../../lib/native-listing-policy.ts";
test("native forms reject mismatched passwords, invalid verification codes, and privileged audience",()=>{
  assert.equal(nativeAuthInput.safeParse({action:"signup",name:"Test User",email:"test@example.com",password:"long-password-123",confirmPassword:"different"}).success,false);
  assert.equal(nativeAuthInput.safeParse({action:"verify",email:"test@example.com",code:"abcdef"}).success,false);
  assert.equal(nativeAuthInput.safeParse({action:"audience",audience:"admin"}).success,false);
  assert.deepEqual(nativeAuthInput.parse({action:"audience",audience:"owner",userId:"another-user",role:"admin"}),{action:"audience",audience:"owner"});
});
test("migrations apply locally; expired/revoked sessions fail and owner choice preserves privileged roles",async()=>{
  const db=new PGlite();
  try {
    for(const name of ["001_core.sql","002_profiles_admin_activity.sql","003_email_accounts.sql","004_native_sessions_locations.sql"])
      await db.exec(readFileSync(new URL("../../db/migrations/"+name,import.meta.url),"utf8"));
    await db.exec("INSERT INTO users(id,email,role) VALUES('member','member@example.test','renter'),('admin','admin@example.test','admin'); INSERT INTO native_sessions(token_hash,user_id,expires_at) VALUES('live','member',now()+interval '1 day'),('expired','member',now()-interval '1 day');");
    assert.equal((await db.query(SESSION_LOOKUP,["live"])).rows.length,1);
    assert.equal((await db.query(SESSION_LOOKUP,["expired"])).rows.length,0);
    await db.query("DELETE FROM native_sessions WHERE token_hash=$1",["live"]);
    assert.equal((await db.query(SESSION_LOOKUP,["live"])).rows.length,0);
    await db.query(ROLE_SELECTION,["landlord","member"]);
    await db.query(ROLE_SELECTION,["renter","admin"]);
    assert.deepEqual((await db.query<{id:string;role:string}>("SELECT id,role FROM users ORDER BY id")).rows,[{id:"admin",role:"admin"},{id:"member",role:"landlord"}]);
    await db.exec("INSERT INTO owner_profiles(user_id,public_name) VALUES('member','Member'); INSERT INTO listings(id,owner_id,slug,title,description,property_type,status,city,barangay,monthly_rent_centavos,published_at,last_confirmed_at) SELECT '00000000-0000-4000-8000-000000000001',id,'test-rental','Test rental','Local fixture only','house','published','Test city','Test area',100000,now(),now() FROM owner_profiles WHERE user_id='member';");
    const id="00000000-0000-4000-8000-000000000001";
    assert.equal((await db.query(UPDATE_OWNER_PIN,[6,124,"admin",id])).rows.length,0);
    assert.equal((await db.query(UPDATE_OWNER_PIN,[6,124,"member",id])).rows.length,1);
    assert.equal((await db.query<{status:string}>("SELECT status FROM listings WHERE id=$1",[id])).rows[0].status,"pending_review");
    await assert.rejects(db.query("UPDATE listings SET latitude=100 WHERE id=$1",[id]));
  }finally {await db.close();}
});
