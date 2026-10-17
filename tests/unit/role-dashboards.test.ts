import {test} from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {createRequire} from "node:module";
import {createElement} from "react";
import {renderToStaticMarkup} from "react-dom/server";
import ts from "typescript";

const nativeRequire=createRequire(import.meta.url);
function load(path:string,dependencies:Record<string,unknown>){
 const code=ts.transpileModule(readFileSync(new URL(path,import.meta.url),"utf8"),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,target:ts.ScriptTarget.ES2022}}).outputText;
 const serviceModule={exports:{} as Record<string,(props:unknown)=>unknown>};
 new Function("require","exports","module",code)((name:string)=>name in dependencies?dependencies[name]:nativeRequire(name),serviceModule.exports,serviceModule);
 return serviceModule.exports;
}
const empty={state:"ready",listings:[]};
const Link=({href,children,...props}:{href:string;children:unknown})=>createElement("a",{href,...props},children as never);
const common={"next/link":{default:Link},"next/navigation":{redirect:(url:string)=>{throw Error(`REDIRECT:${url}`);}},"@/components/search-form":{SearchForm:()=>createElement("div",null,"Search filters")},"@/components/guide-nudge":{GuideNudge:()=>null},"next/image":{default:()=>null},"@/lib/rental-photos":{safePhotoUrls:()=>[]},"@/components/rental-social":{RentalSocial:()=>null},"@/lib/search-filters":{parseRentalFilters:()=>({city:"Test City"}),formatRent:()=>"₱100"}};
test("rental search gives renters search/messages actions and reserves owner prompts for owners or guests",async()=>{
 for(const role of ["renter","landlord",null]){
  const page=load("../../app/rentals/page.tsx",{...common,"@/lib/listings":{browsePublishedListings:async()=>empty},"@/lib/session-user":{currentUser:async()=>role?{role}:null}}).default;
  const html=renderToStaticMarkup(await page({searchParams:Promise.resolve({})}) as never);
  assert.equal(html.includes("Own a rental?"),role!=="renter");
  if(role==="renter"){assert.ok(html.includes("Adjust your search"));assert.ok(html.includes("My messages"));assert.ok(!html.includes('href="/owner"'));}
 }
});
test("authenticated home selects the renter dashboard and routes owners to their studio",async()=>{
 for(const role of ["renter","landlord"]){
  const page=load("../../app/page.tsx",{...common,"@/components/featured-rentals":{FeaturedRentalsPanel:()=>null},"@/lib/listings":{getLatestPublishedListings:async()=>empty},"@/components/first-visit-intro":{FirstVisitIntro:()=>null},"@/lib/session-user":{currentUser:async()=>({role,displayName:"Local tester"})},"@/components/renter-dashboard":{RenterDashboard:()=>createElement("h1",null,"Renter workspace")}}).default;
  if(role==="landlord")await assert.rejects(page({searchParams:Promise.resolve({})}) as Promise<unknown>,/REDIRECT:\/owner/);
  else assert.match(renderToStaticMarkup(await page({searchParams:Promise.resolve({})}) as never),/Renter workspace/);
 }
});
test("renter dashboard contains discovery and tenancy tools without owner links",()=>{
 const featured=load("../../components/featured-rentals.tsx",common).FeaturedRentalsPanel;
 const dashboard=load("../../components/renter-dashboard.tsx",{...common,"@/components/featured-rentals":{FeaturedRentalsPanel:featured}}).RenterDashboard;
 const html=renderToStaticMarkup(createElement(dashboard as never,{name:"Local tester",latest:empty}));
 assert.ok(html.includes("RENTER WORKSPACE"));assert.ok(html.includes("Messages &amp; my tenancy"));assert.ok(!html.includes('href="/owner"'));assert.ok(!html.includes("List a property"));
});
test("phone navigation shows messages for renters and listings only for owners",()=>{
 const component=load("../../components/mobile-bottom-nav.tsx",{...common,"next/navigation":{usePathname:()=>"/rentals"}}).MobileBottomNav;
 for(const role of ["renter","landlord",null]){
  const html=renderToStaticMarkup(createElement(component as never,{role}));
  assert.equal(html.includes('href="/owner"'),role==="landlord");
  assert.equal(html.includes('href="/inbox"'),role==="renter");
 }
});
test("renter cannot open the owner dashboard, even by typing its URL",async()=>{
 const page=load("../../app/owner/page.tsx",{...common,"@/auth":{},"@/lib/session-user":{currentUser:async()=>({role:"renter"})},"@/lib/db":{getDatabase:()=>{throw Error("Database must not be read");}},"@/db/schema":{},"./actions":{}}).default;
 await assert.rejects(page({searchParams:Promise.resolve({})}) as Promise<unknown>,/REDIRECT:\//);
});
