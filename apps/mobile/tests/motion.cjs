const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),ts=require('typescript');
const slots=[];let index=0,effects=[],pending=[];
const react={useRef(value){const i=index++;return slots[i]??(slots[i]={current:value});},useEffect(effect,deps){const i=index++,old=slots[i];if(!old||deps.some((v,n)=>v!==old.deps[n]))effects.push(()=>{old?.cleanup?.();slots[i]={deps,cleanup:effect()};});},useState(){throw Error('Unexpected state hook');}};
class Value{constructor(value){this.value=value;}setValue(value){this.value=value;}interpolate(config){return config;}}
function animation(children=[]){let callback,active=false;return {children,start(cb){active=true;callback=cb;pending.push(this);},stop(){if(active){active=false;callback?.({finished:false});}},finish(){if(active){active=false;callback?.({finished:true});}}};}
const native={Animated:{Value,parallel:animation,timing:(value,config)=>({value,config}),spring:(value,config)=>({value,config})},Easing:{in:x=>x,quad:x=>x}};
const compiled=ts.transpileModule(fs.readFileSync(path.join(__dirname,'../src/motion.ts'),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText;
const output={};new Function('require','exports',compiled)(name=>name==='react'?react:native,output);
let scene;
function render(key,reduced){index=0;effects=[];scene=output.useSceneTransition(key,reduced);effects.forEach(fn=>fn());}
function finish(){const batch=pending;pending=[];batch.forEach(a=>a.finish());}
let commits=0;
render('intro-0',false);
scene.change(()=>commits++);assert.equal(commits,0,'initial entrance blocks overlapping navigation');finish();
scene.change(()=>commits++);scene.change(()=>commits++);assert.equal(commits,0,'screen must not change before exit completes');
assert.equal(pending.at(-1).children[1].config.toValue,-24,'forward exits to the left');finish();assert.equal(commits,1,'rapid taps commit only once');
render('intro-1',false);finish();scene.change(()=>commits++,false);
assert.equal(pending.at(-1).children[1].config.toValue,24,'back exits to the right');finish();assert.equal(commits,2);
render('intro-0',false);assert.equal(slots[1].current.value,-32,'back enters from the left');finish();
render('intro-0',true);scene.change(()=>commits++);assert.equal(commits,3,'reduced motion navigates immediately');assert.equal(slots[0].current.value,1);
render('intro-1',false);finish();scene.change(()=>commits++);slots.forEach(slot=>slot.cleanup?.());finish();assert.equal(commits,3,'unmount cancels a pending navigation callback');
console.log('Passed motion direction, rapid-tap guard, reduced motion and unmount cancellation.');
