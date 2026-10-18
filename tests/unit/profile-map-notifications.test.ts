import {test} from "node:test";
import assert from "node:assert/strict";
import {validProfilePhoto} from "../../lib/profile-photo.ts";
import {unreadArrivals} from "../../lib/notification-arrivals.ts";
import {readFileSync} from "node:fs";
import {PGlite} from "@electric-sql/pglite";
import ts from "typescript";
import * as drizzle from "drizzle-orm";
import {PgDialect} from "drizzle-orm/pg-core";
test("profile thumbnails accept bounded image data and reject executable/remote/oversized input",()=>{
 assert.equal(validProfilePhoto(""),true);
 assert.equal(validProfilePhoto("data:image/jpeg;base64,"+Buffer.from([255,216,255,224]).toString("base64")),true);
 for(const value of [null,"https://example.com/photo.jpg","data:image/svg+xml;base64,PHN2Zz4=","data:image/jpeg;base64,SGVsbG8=","x".repeat(180001)])assert.equal(validProfilePhoto(value),false);
});
test("notification sound skips initial history, old IDs and read notices; sounds once for new unread arrivals",()=>{
 const notice={id:"one",readAt:null};const initial=unreadArrivals(null,[notice]);assert.equal(initial.hasNew,false);
 assert.equal(unreadArrivals(initial.next,[notice]).hasNew,false);
 assert.equal(unreadArrivals(initial.next,[notice,{id:"two",readAt:"2026-01-01"}]).hasNew,false);
 const arrival=unreadArrivals(initial.next,[notice,{id:"three",readAt:null}]);assert.equal(arrival.hasNew,true);
 assert.equal(unreadArrivals(arrival.next,[notice,{id:"three",readAt:null}]).hasNew,false);
});
test("photo migration preserves existing profiles and limits saved thumbnail size",async()=>{
 const db=new PGlite();try{await db.exec(readFileSync(new URL("../../db/migrations/001_core.sql",import.meta.url),"utf8"));await db.exec("INSERT INTO users(id,email,display_name,role) VALUES('renter','renter@example.test','Existing renter','renter')");await db.exec(readFileSync(new URL("../../db/migrations/007_profile_photo.sql",import.meta.url),"utf8"));const result=await db.query<{display_name:string;role:string;profile_photo:string|null}>("SELECT display_name,role,profile_photo FROM users WHERE id='renter'");assert.deepEqual(result.rows,[{display_name:"Existing renter",role:"renter",profile_photo:null}]);await assert.rejects(db.query("UPDATE users SET profile_photo=$1 WHERE id='renter'",["x".repeat(180001)]));}finally{await db.close();}
});
test("profile photo writes require a same-origin session and cannot target another user",async()=>{
 const code=ts.transpileModule(readFileSync(new URL("../../app/api/profile-photo/route.ts",import.meta.url),"utf8"),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText;
 let user:{id:string}|null={id:"owner-account"};const queries:Array<{sql:string;params:unknown[]}>=[];
 const endpoint:{POST?:(r:Request)=>Promise<Response>}={};
 new Function("require","exports",code)((name:string)=>({"next/server":{NextResponse:{json:(v:unknown,init?:ResponseInit)=>Response.json(v,init)}},"drizzle-orm":drizzle,"@/lib/session-user":{currentUser:async()=>user},"@/lib/profile-photo":{validProfilePhoto},"@/lib/email-auth":{consumeRateLimit:async()=>true},"@/lib/db":{getDatabase:()=>({execute:async(q:Parameters<PgDialect["sqlToQuery"]>[0])=>{queries.push(new PgDialect().sqlToQuery(q));return {rows:[]};}})}}[name]),endpoint);
 const photo="data:image/jpeg;base64,"+Buffer.from([255,216,255,224]).toString("base64");
 const request=(origin:string)=>new Request("https://local.test/api/profile-photo",{method:"POST",headers:{origin,"Content-Type":"application/json"},body:JSON.stringify({photo,userId:"victim"})});
 assert.equal((await endpoint.POST!(request("https://other.test"))).status,403);assert.equal(queries.length,0);
 assert.equal((await endpoint.POST!(request("https://local.test"))).status,200);assert.deepEqual(queries[0].params,[photo,"owner-account"]);
 user=null;assert.equal((await endpoint.POST!(request("https://local.test"))).status,401);assert.equal(queries.length,1);
});
