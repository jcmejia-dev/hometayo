import {test} from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import ts from "typescript";
import {withDeadline} from "../../apps/mobile/src/deadline.ts";
test("location deadline settles stalled work and preserves successful results",async()=>{
 assert.equal(await withDeadline(Promise.resolve("location"),100,"timeout"),"location");
 await assert.rejects(withDeadline(new Promise(()=>{}),5,"Location timed out"),/Location timed out/);
});
test("press feedback preserves layout, busy state, handlers and reduced-motion behavior",()=>{
 const compiled=ts.transpileModule(readFileSync(new URL("../../apps/mobile/src/feedback-pressable.tsx",import.meta.url),"utf8"),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true}}).outputText;
 for(const reduced of [false,true]){
  const animations:Array<{toValue:number}>=[];let entered=0,left=0,pressed=false;
  const react={useEffect:()=>{},useRef:(value:unknown)=>({current:value}),useState:()=>[false,(value:boolean)=>{pressed=value;} ]};
  class Value{value:number;constructor(value:number){this.value=value;}setValue(value:number){this.value=value;}stopAnimation(){}}
  const output:Record<string,(props:Record<string,unknown>)=>{props:{accessibilityState:{busy:boolean};style:[{padding:number},{transform:Array<{rotate?:string}>}];onPressIn:(event:object)=>void;onPressOut:(event:object)=>void}}>={};
  const mockRequire=(name:string)=>{if(name==="react")return react;if(name==="react/jsx-runtime")return {jsx:(type:unknown,props:unknown)=>({type,props})};if(name==="./theme")return {useTheme:()=>({reducedMotion:reduced}),usePalette:()=>({border:"#dce8de"})};if(name==="react-native")return {Pressable:"Pressable",StyleSheet:{flatten:(value:unknown)=>value},Animated:{Value,createAnimatedComponent:()=>"AnimatedPressable",spring:(_:unknown,config:{toValue:number})=>{animations.push(config);return {start(){}};}}};throw Error(name);};
  new Function("require","exports",compiled)(mockRequire,output);
  const node=output.FeedbackPressable({style:{padding:16,transform:[{rotate:"2deg"}]},accessibilityState:{busy:true},onPressIn:()=>entered++,onPressOut:()=>left++,children:"Search"});
  assert.equal(node.props.accessibilityState.busy,true);assert.equal(node.props.style[0].padding,16);assert.equal(node.props.style[1].transform[0].rotate,"2deg");
  node.props.onPressIn({});assert.equal(pressed,true);node.props.onPressOut({});assert.equal(pressed,false);assert.equal(entered,1);assert.equal(left,1);
  assert.deepEqual(animations.map(a=>a.toValue),reduced?[]:[.965,1]);
 }
});
test("map config bootstraps locally, rejects a missing cloud key and uses a configured key",()=>{
 const compiled=ts.transpileModule(readFileSync(new URL("../../apps/mobile/app.config.ts",import.meta.url),"utf8"),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText;
 const output:{default?:(context:unknown)=>{extra:{mapsConfigured:boolean};plugins:Array<string|[string,{androidGoogleMapsApiKey:string}]>}}={};const environment:Record<string,string>={REQUIRE_ANDROID_MAPS:"true"};
 new Function("exports","process",compiled)(output,{env:environment});
 const config={config:{extra:{eas:{projectId:"fixture"}},android:{package:"app.hometayo.mobile"}}};
 assert.equal(output.default!(config).extra.mapsConfigured,false,"local config must load before EAS downloads environment variables");
 environment.EAS_BUILD="true";
 assert.throws(()=>output.default!(config),/GOOGLE_MAPS_ANDROID_API_KEY/);
 environment.GOOGLE_MAPS_ANDROID_API_KEY=" test-key-only ";const result=output.default!(config);
 assert.equal(result.extra.mapsConfigured,true);const maps=result.plugins.find(p=>Array.isArray(p)&&p[0]==="react-native-maps");assert.ok(Array.isArray(maps));assert.equal(maps[1].androidGoogleMapsApiKey,"test-key-only");
});
