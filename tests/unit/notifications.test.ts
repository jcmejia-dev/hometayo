import {test} from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import ts from "typescript";

function endpoint(userId:string|null,fail=false){
  const source=readFileSync(new URL("../../app/api/notifications/route.ts",import.meta.url),"utf8");
  const js=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
  const calls:string[]=[];
  const serviceModule={exports:{} as {GET:()=>Promise<Response>}};
  new Function("require","exports","module",js)((name:string)=>({
    "next/server":{NextResponse:{json:(data:unknown,init?:ResponseInit)=>Response.json(data,init)}},
    "@/lib/session-user":{currentUser:async()=>userId?{id:userId}:null},
    "@/lib/rental-operations":{headerNotificationState:async(id:string)=>{calls.push(id);if(fail)throw Error("private database detail");return {notifications:[{id:"local-notice",body:"Local test update"}],conversations:[{id:"conversation-1",otherName:"Local renter"}]};}},
  }[name]),serviceModule.exports,serviceModule);
  return {...serviceModule.exports,calls};
}
test("header notifications deny guests without querying and never cache private responses",async()=>{
  const h=endpoint(null),response=await h.GET();assert.equal(response.status,401);assert.deepEqual(h.calls,[]);assert.equal(response.headers.get("cache-control"),"no-store");
});
test("header notifications query only the signed-in account",async()=>{
  const h=endpoint("owner-account"),response=await h.GET();assert.equal(response.status,200);assert.deepEqual(h.calls,["owner-account"]);assert.equal(response.headers.get("cache-control"),"no-store");assert.deepEqual(await response.json(),{notifications:[{id:"local-notice",body:"Local test update"}],conversations:[{id:"conversation-1",otherName:"Local renter"}]});
});
test("header notification failures return a safe retry response",async()=>{
  const h=endpoint("renter-account",true),response=await h.GET();assert.equal(response.status,503);assert.doesNotMatch(await response.text(),/private database/);
});
