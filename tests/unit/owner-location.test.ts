import {test} from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import ts from "typescript";
import {isPoint} from "../../lib/geo.ts";
import {readPropertyPin} from "../../lib/property-location-input.ts";

test("property pins accept paired locations and reject incomplete or invalid coordinates",()=>{
 assert.equal(readPropertyPin("",""),null);assert.equal(readPropertyPin(" "," "),null);
 assert.deepEqual(readPropertyPin("0","0"),{latitude:0,longitude:0});
 for(const pair of [["","125"],["7",""],["NaN","125"],["91","125"],["7","181"],["Infinity","0"]])assert.throws(()=>readPropertyPin(pair[0],pair[1]));
});

function harness({key="local-test-key",allowed=true,places=[] as unknown[]}={}){
 const source=readFileSync(new URL("../../lib/places-search.ts",import.meta.url),"utf8");
 const js=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
 const serviceModule={exports:{} as {searchPlaces:(id:string,q:string)=>Promise<{status:number;places?:unknown[];message?:string}>}};
 const requests:Array<{url:string;options:RequestInit}>=[];
 new Function("require","exports","module","process","fetch",js)(
  (name:string)=>name==="./geo"?{isPoint}:name==="./email-auth"?{consumeRateLimit:async()=>allowed}:{},serviceModule.exports,serviceModule,
  {env:{GOOGLE_PLACES_API_KEY:key}},async(url:string,options:RequestInit)=>{requests.push({url,options});return Response.json({places});},
 );
 return {...serviceModule.exports,requests};
}
test("owner address lookup validates input, rate limits, and configured service before external requests",async()=>{
 const missing=harness({key:""});assert.equal((await missing.searchPlaces("owner","Davao City")).status,503);assert.equal(missing.requests.length,0);
 const limited=harness({allowed:false});assert.equal((await limited.searchPlaces("owner","Davao City")).status,429);assert.equal(limited.requests.length,0);
 const invalid=harness();assert.equal((await invalid.searchPlaces("owner","A")).status,400);assert.equal((await invalid.searchPlaces("owner","X".repeat(151))).status,400);assert.equal(invalid.requests.length,0);
});
test("owner address lookup returns only valid place points and keeps server credentials private",async()=>{
 const h=harness({places:[{id:"valid",displayName:{text:"Address result"},formattedAddress:"Test address",location:{latitude:7.05,longitude:125.58}},{id:"invalid",location:{latitude:999,longitude:125}},{id:"missing"}]});
 const result=await h.searchPlaces("owner","Address in Davao");assert.equal(result.status,200);
 assert.deepEqual(result.places,[{id:"valid",name:"Address result",address:"Test address",latitude:7.05,longitude:125.58}]);
 assert.equal(h.requests.length,1);assert.equal(h.requests[0].url,"https://places.googleapis.com/v1/places:searchText");
 assert.equal(JSON.parse(String(h.requests[0].options.body)).textQuery,"Address in Davao");
 assert.equal(JSON.stringify(result).includes("local-test-key"),false);
});
