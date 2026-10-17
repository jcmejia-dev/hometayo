import {test} from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {createRequire} from "node:module";
import ts from "typescript";

const requireDependency = createRequire(import.meta.url);
function load(relative: string, dependencies: Record<string,unknown>, env = {}) {
  const source = readFileSync(new URL(relative,import.meta.url),"utf8");
  const js = ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
  const serviceModule = {exports:{} as Record<string,unknown>};
  new Function("require","exports","module","process","console",js)(
    (name: string) => name in dependencies ? dependencies[name] : requireDependency(name),
    serviceModule.exports,serviceModule,{env},{error:()=>{}},
  );
  return serviceModule.exports;
}
const validation = load("../../lib/property-validation.ts",{});
function harness({role="landlord",failure=false,session=true}={}) {
  let writes = 0;
  const db = {
    select:()=>({from:()=>({where:()=>({limit:async()=>[{id:"00000000-0000-4000-8000-000000000001"}]})})}),
    execute:async()=>{if(failure)throw new Error("private SQL and credentials");writes++;},
  };
  const actions = load("../../app/owner/actions.ts",{
    "next/cache":{revalidatePath:()=>{}},
    "next/navigation":{redirect:(url:string)=>{throw new Error(`REDIRECT:${url}`);}},
    "@/db/schema":{ownerProfiles:{userId:"userId",id:"id"}},
    "@/lib/db":{getDatabase:()=>db},
    "@/lib/session-user":{requireAccount:async()=>{if(!session)throw new Error("Please sign in to continue.");return {id:"owner",role};}},
    "@/lib/property-validation":validation,
  },{ENABLE_RENTAL_MANAGEMENT:"true"});
  return {submit:actions.createProperty as (form:FormData)=>Promise<{error:string}>,writes:()=>writes};
}
function form() {
  const data = new FormData();
  for(const [key,value] of Object.entries({title:"Local test apartment",description:"Synthetic property for submission testing only.",propertyType:"apartment",rentalMode:"per_room",city:"Test City",province:"Test Province",barangay:"Test area",monthlyRent:"3000",bedrooms:"1",bathrooms:"1",availableSlots:"1",furnished:"partial"}))data.set(key,value);
  return data;
}
test("submission gives field validation and pin-confirmation errors without database writes",async()=>{
  const h=harness(),data=form();data.set("description","Too short");
  assert.match((await h.submit(data)).error,/Description/);assert.equal(h.writes(),0);
  data.set("description","Synthetic property for submission testing only.");data.set("latitude","7");data.set("longitude","125");
  assert.match((await h.submit(data)).error,/confirmation checkbox/);assert.equal(h.writes(),0);
});
test("submission reports expired sessions, disallowed roles and safe database failures",async()=>{
  assert.match((await harness({session:false}).submit(form())).error,/session has expired/);
  assert.match((await harness({role:"renter"}).submit(form())).error,/property-owner account/);
  const error=(await harness({failure:true}).submit(form())).error;
  assert.match(error,/could not submit/);assert.doesNotMatch(error,/private SQL|credentials/);
});
test("successful submission writes once then redirects to the owner confirmation",async()=>{
  const h=harness();await assert.rejects(h.submit(form()),/REDIRECT:\/owner\?submitted=1/);assert.equal(h.writes(),1);
});
