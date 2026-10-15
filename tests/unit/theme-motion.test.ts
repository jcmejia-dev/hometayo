import {test} from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import ts from "typescript";
test("theme reveal expands from the chosen swatch and reduced motion commits immediately",async()=>{
 const source=ts.transpileModule(readFileSync(new URL("../../components/theme-motion.ts",import.meta.url),"utf8"),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText;
 for(const reduced of [false,true]){
  let started=0,commits=0,animation:Record<string,unknown>|null=null,finish=()=>{};
  const document={documentElement:{dataset:{} as Record<string,string>,animate:(frames:unknown,options:Record<string,unknown>)=>{animation={frames,options};}},startViewTransition:(commit:()=>void)=>{started++;commit();return {skipTransition(){},ready:Promise.resolve(),finished:new Promise<void>(resolve=>{finish=resolve;})};}};
  const output:{revealTheme?:(commit:()=>void,trigger:unknown)=>void}={};
  new Function("require","exports","document","matchMedia","innerWidth","innerHeight",source)(()=>({flushSync:(commit:()=>void)=>commit()}),output,document,()=>({matches:reduced}),1000,800);
  output.revealTheme!(()=>commits++,{getBoundingClientRect:()=>({left:80,top:180,width:40,height:40})});
  await Promise.resolve();assert.equal(commits,1);
  if(reduced){assert.equal(started,0);assert.equal(animation,null);}else{assert.equal(started,1);assert.ok(animation);const captured=animation as Record<string,unknown>;assert.equal((captured.options as Record<string,unknown>).pseudoElement,"::view-transition-new(root)");assert.match(JSON.stringify(captured.frames),/100px 200px/);finish();}
 }
});
