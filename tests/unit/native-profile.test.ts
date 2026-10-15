import {test} from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {PGlite} from "@electric-sql/pglite";
import {publicAccountRole} from "../../lib/admin-policy.ts";
import ts from "typescript";
import {profileSettingsSchema} from "../../lib/profile-settings.ts";
test("native profile requires a session, updates only that user, and preserves role/email",async()=>{
 const db=new PGlite();try{
  for(const file of ["001_core.sql","002_profiles_admin_activity.sql"])await db.exec(readFileSync(new URL("../../db/migrations/"+file,import.meta.url),"utf8"));
  await db.exec("INSERT INTO users(id,email,role) VALUES('first','first@example.test','renter'),('second','second@example.test','landlord')");
  let account:{id:string}|null=null;
  const compiled=ts.transpileModule(readFileSync(new URL("../../app/api/mobile/profile/route.ts",import.meta.url),"utf8"),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText;
  const exports:Record<string,(r:Request)=>Promise<Response>>={};
  const mockRequire=(name:string)=>{if(name==="next/server")return {NextResponse:{json:(body:unknown,init:ResponseInit)=>Response.json(body,init)}};if(name==="@/lib/admin-policy")return {publicAccountRole};if(name==="@/lib/profile-settings")return {profileSettingsSchema};if(name==="@/lib/native-auth")return {nativeAccount:async()=>account,nativeDb:()=>({query:async(sql:string,params:unknown[])=>(await db.query(sql,params)).rows})};throw Error(name);};
  new Function("require","exports",compiled)(mockRequire,exports);
  const request=(body:unknown)=>new Request("https://test.local/api/mobile/profile",{method:"PATCH",headers:{"content-type":"application/json"},body:JSON.stringify(body)});
  const values={preferredName:"Jamie",homeCity:"Koronadal City",preferredPropertyType:"house",preferredBudgetPesos:"12000",id:"second",role:"admin",email:"changed@example.test"};
  assert.equal((await exports.PATCH(request(values))).status,401);
  account={id:"first"};
  assert.equal((await exports.PATCH(request({...values,preferredBudgetPesos:"1.5"}))).status,400);
  assert.equal((await exports.PATCH(request(values))).status,200);
  const saved=await (await exports.GET(new Request("https://test.local"))).json();assert.equal(saved.profile.preferredName,"Jamie");assert.equal(saved.profile.preferredBudgetPesos,12000);
  const rows=await db.query<{id:string;role:string;email:string;preferred_name:string|null}>("SELECT id,role,email,preferred_name FROM users ORDER BY id");
  assert.deepEqual(rows.rows,[{id:"first",role:"renter",email:"first@example.test",preferred_name:"Jamie"},{id:"second",role:"landlord",email:"second@example.test",preferred_name:null}]);
 }finally{await db.close();}
});
