import {test} from "node:test";
import assert from "node:assert/strict";
import {createHash} from "node:crypto";
import {readFileSync} from "node:fs";
import ts from "typescript";
import {ownerAllowed,publicAccountRole} from "../../lib/admin-policy.ts";
const digest=createHash("sha256").update("owner@example.test").digest("hex");
test("only the pinned identity can administer; role labels never grant access",()=>{
 assert.equal(ownerAllowed(null,digest),false);assert.equal(ownerAllowed({email:"owner@example.test"},""),false);
 for(const role of ["renter","landlord","moderator","admin"]){const other={email:"other@example.test",role};assert.equal(ownerAllowed(other,digest),false);}
 assert.equal(ownerAllowed({email:" OWNER@example.test "},digest),true);
 assert.equal(publicAccountRole("admin"),"renter");assert.equal(publicAccountRole("moderator"),"renter");assert.equal(publicAccountRole("landlord"),"landlord");
});
test("review server action denies a non-owner with a stored admin role before database access",async()=>{
 let reads=0;
 const compiled=ts.transpileModule(readFileSync(new URL("../../app/admin/actions.ts",import.meta.url),"utf8"),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText;
 const exports:Record<string,(form:FormData)=>Promise<void>>={};
 const mockRequire=(name:string)=>{if(name==="@/lib/admin-owner")return {canAdminister:(account:{email:string})=>ownerAllowed(account,digest)};if(name==="@/lib/session-user")return {requireAccount:async()=>({id:"intruder",email:"other@example.test",role:"admin"})};if(name==="@/lib/db")return {getDatabase:()=>{reads++;throw Error("Unexpected database access");}};return {};};
 new Function("require","exports",compiled)(mockRequire,exports);
 await assert.rejects(exports.reviewProperty(new FormData()),/Not authorized/);assert.equal(reads,0);
});
