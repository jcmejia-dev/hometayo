"use client";
import {useState} from "react";
import {RefreshCw,RotateCcw,Sparkles} from "lucide-react";
import {avatarOptions,defaultAvatar,normalizeAvatar,randomAvatar,type AvatarConfig} from "@/lib/avatar-config";
import styles from "./avatar-editor.module.css";

type Tab="face"|"hair"|"style"|"extras";
const labels:Record<string,string>={
 oval:"Oval",round:"Round","soft-square":"Soft square",heart:"Heart",
 crop:"Crop",waves:"Waves",bun:"Bun",spikes:"Textured",curly:"Curly",bob:"Bob",fade:"Fade",braids:"Braids",ponytail:"Ponytail",buzz:"Buzz cut",
 soft:"Soft",straight:"Straight",arched:"Arched",bold:"Bold",
 none:"None",stubble:"Stubble",mustache:"Mustache",goatee:"Goatee",beard:"Beard",
 tee:"T-shirt",collared:"Collared",hoodie:"Hoodie",sweater:"Sweater",blazer:"Blazer",
 "round-glasses":"Round glasses","square-glasses":"Square glasses",earrings:"Earrings",cap:"Cap",headband:"Headband",
 smile:"Smile",happy:"Happy",wink:"Wink",calm:"Calm",confident:"Confident",cool:"Cool",
};

function faceDimensions(shape:string){
 if(shape==="round")return {rx:30,ry:30};
 if(shape==="soft-square")return {rx:27,ry:33};
 if(shape==="heart")return {rx:29,ry:34};
 return {rx:28,ry:34};
}

export function AvatarFace({config,size=148}:{config:AvatarConfig;size?:number}){
 const a=normalizeAvatar(config);const face=faceDimensions(a.faceShape);
 const hair=()=>{
  if(a.hair==="crop")return <path d="M27 43c1-19 14-30 29-30s28 12 29 30c-8-9-17-13-29-13S35 34 27 43Z" fill={a.hairColor}/>;
  if(a.hair==="waves")return <path d="M24 45c1-22 14-33 31-33 19 0 31 12 32 35-8-3-11-12-14-18-4 8-10 12-18 12-8 0-14-4-18-11-2 7-5 12-13 15Z" fill={a.hairColor}/>;
  if(a.hair==="bun")return <><circle cx="57" cy="13" r="12" fill={a.hairColor}/><path d="M27 45c1-20 13-31 29-31 17 0 29 11 30 31-8-10-18-15-30-15S35 35 27 45Z" fill={a.hairColor}/></>;
  if(a.hair==="spikes")return <path d="M23 45 29 18l8 8 6-16 10 13 8-15 7 18 12-10 7 31c-7-10-18-17-31-17-14 0-25 6-33 15Z" fill={a.hairColor}/>;
  if(a.hair==="bob")return <path d="M24 50c0-25 13-39 32-39 20 0 33 14 33 40v17l-11-5V42c-5-10-12-15-22-15-11 0-19 5-23 15v22l-9 5Z" fill={a.hairColor}/>;
  if(a.hair==="fade")return <><path d="M29 38c3-17 13-26 28-26 14 0 24 8 28 24-9-4-17-6-28-6-10 0-19 3-28 8Z" fill={a.hairColor}/><path d="M28 34v18M85 34v18" stroke={a.hairColor} strokeWidth="5" strokeLinecap="round"/></>;
  if(a.hair==="braids")return <><path d="M27 43c2-20 13-31 29-31 17 0 29 11 30 31-8-9-18-14-30-14-11 0-21 5-29 14Z" fill={a.hairColor}/>{[31,81].map((x,i)=><path key={i} d={`M${x} 38c${i?6:-6} 10 ${i?5:-5} 23 ${i?8:-8} 33`} stroke={a.hairColor} strokeWidth="6" strokeLinecap="round" fill="none"/>)}</>;
  if(a.hair==="ponytail")return <><circle cx="88" cy="34" r="13" fill={a.hairColor}/><path d="M27 44c2-20 13-31 29-31 17 0 29 11 30 31-8-9-18-14-30-14S35 35 27 44Z" fill={a.hairColor}/></>;
  if(a.hair==="buzz")return <path d="M29 38c3-16 13-25 28-25 14 0 24 8 27 24-8-5-17-7-28-7-10 0-19 3-27 8Z" fill={a.hairColor} opacity=".92"/>;
  return <>{[[31,29,11],[43,20,12],[56,18,13],[69,22,12],[79,31,11],[34,39,12],[49,34,13],[65,35,13]].map(([cx,cy,r],i)=><circle key={i} cx={cx} cy={cy} r={r} fill={a.hairColor}/>)}</>;
 };
 const brows=()=>{
  const width=a.brows==="bold"?3.4:2.4;
  if(a.brows==="straight")return <><path d="M38 46h14M61 46h14" stroke="#45342D" strokeWidth={width} strokeLinecap="round"/></>;
  if(a.brows==="arched")return <><path d="M38 47q7-7 14 0M61 47q7-7 14 0" stroke="#45342D" strokeWidth={width} strokeLinecap="round" fill="none"/></>;
  return <><path d="M38 47q7-4 14 0M61 47q7-4 14 0" stroke="#45342D" strokeWidth={width} strokeLinecap="round" fill="none"/></>;
 };
 const eyes=()=>a.expression==="wink"?<><path d="M40 55q5-5 10 0" stroke="#30241E" strokeWidth="2.8" strokeLinecap="round" fill="none"/><circle cx="68" cy="54" r="2.6" fill="#30241E"/></>:a.expression==="cool"?<><path d="M40 54h10M63 54h10" stroke="#30241E" strokeWidth="3" strokeLinecap="round"/></>:a.expression==="calm"?<><path d="M40 54q5 3 10 0M63 54q5 3 10 0" stroke="#30241E" strokeWidth="2.5" strokeLinecap="round" fill="none"/></>:<><circle cx="45" cy="54" r="2.6" fill="#30241E"/><circle cx="68" cy="54" r="2.6" fill="#30241E"/></>;
 const facialHair=()=>{
  if(a.facialHair==="stubble")return <path d="M43 65q13 12 26 0M45 70q11 7 22 0" stroke={a.hairColor} strokeWidth="1.2" strokeDasharray="1 3" opacity=".7" fill="none"/>;
  if(a.facialHair==="mustache")return <path d="M48 65q8-6 16 0-4 5-8 1-4 4-8-1Z" fill={a.hairColor}/>;
  if(a.facialHair==="goatee")return <><path d="M48 65q8-6 16 0-4 5-8 1-4 4-8-1Z" fill={a.hairColor}/><path d="M51 72q5 8 10 0" stroke={a.hairColor} strokeWidth="4" strokeLinecap="round"/></>;
  if(a.facialHair==="beard")return <path d="M37 62q2 27 19 31 17-4 20-31-7 13-20 13T37 62Z" fill={a.hairColor} opacity=".9"/>;
  return null;
 };
 const outfit=()=>{
  if(a.outfitStyle==="collared")return <><path d="M20 112c2-24 16-37 36-37s34 13 36 37" fill={a.outfit}/><path d="m45 78 11 13 11-13-4 18H49Z" fill="#fff" opacity=".92"/></>;
  if(a.outfitStyle==="hoodie")return <><path d="M18 112c2-25 16-38 38-38s36 13 38 38" fill={a.outfit}/><path d="M38 80q18-13 36 0-4 16-18 16S42 90 38 80Z" fill="none" stroke="#fff" strokeWidth="2" opacity=".55"/></>;
  if(a.outfitStyle==="sweater")return <><path d="M18 112c2-25 16-38 38-38s36 13 38 38" fill={a.outfit}/><path d="M42 78q14 10 28 0" stroke="#fff" strokeWidth="3" opacity=".5" fill="none"/></>;
  if(a.outfitStyle==="blazer")return <><path d="M17 112c3-24 18-37 39-37s36 13 39 37" fill={a.outfit}/><path d="m41 78 15 17 15-17-8 28H49Z" fill="#fff" opacity=".9"/><path d="m42 78 14 17 14-17" stroke="#263238" strokeWidth="2" fill="none" opacity=".5"/></>;
  return <path d="M17 112c3-24 18-37 39-37s36 13 39 37Z" fill={a.outfit}/>;
 };
 const accessory=()=>{
  if(a.accessory==="round-glasses")return <><circle cx="45" cy="54" r="8" fill="none" stroke="#25323C" strokeWidth="2"/><circle cx="68" cy="54" r="8" fill="none" stroke="#25323C" strokeWidth="2"/><path d="M53 54h7" stroke="#25323C" strokeWidth="2"/></>;
  if(a.accessory==="square-glasses")return <><rect x="36" y="47" width="18" height="14" rx="4" fill="none" stroke="#25323C" strokeWidth="2"/><rect x="59" y="47" width="18" height="14" rx="4" fill="none" stroke="#25323C" strokeWidth="2"/><path d="M54 53h5" stroke="#25323C" strokeWidth="2"/></>;
  if(a.accessory==="earrings")return <><circle cx="27" cy="61" r="2.8" fill="#D4A72C"/><circle cx="85" cy="61" r="2.8" fill="#D4A72C"/></>;
  if(a.accessory==="cap")return <><path d="M28 32q4-21 28-21 22 0 29 20-28-10-57 1Z" fill={a.outfit}/><path d="M61 28q19-3 30 5-15 2-29 0Z" fill={a.outfit}/></>;
  if(a.accessory==="headband")return <path d="M28 31q28-12 57 0" stroke={a.outfit} strokeWidth="7" strokeLinecap="round" fill="none"/>;
  return null;
 };
 const mouth=a.expression==="happy"?"M43 66q13 13 26 0":a.expression==="confident"?"M47 67q10 2 20-2":a.expression==="calm"?"M48 68h16":a.expression==="cool"?"M47 68q9 5 18 0":"M46 67q10 8 20 0";
 return <svg className={styles.avatar} style={{width:size,height:size}} viewBox="0 0 112 112" role="img" aria-label="Your HomeTayo avatar">
  <rect width="112" height="112" rx="26" fill={a.background}/>
  <circle cx="92" cy="19" r="17" fill="#fff" opacity=".18"/><circle cx="18" cy="93" r="24" fill="#fff" opacity=".12"/>
  {outfit()}<path d="M47 72h18v15H47Z" fill={a.skin}/><circle cx="28" cy="55" r="6.5" fill={a.skin}/><circle cx="84" cy="55" r="6.5" fill={a.skin}/>
  <ellipse cx="56" cy="52" rx={face.rx} ry={face.ry} fill={a.skin}/>{a.faceShape==="heart"?<path d="M35 68q21 25 42 0-6 19-21 22-15-3-21-22Z" fill={a.skin}/>:null}
  {hair()}{brows()}{eyes()}<path d={mouth} stroke="#8E4635" strokeWidth="2.7" strokeLinecap="round" fill="none"/>{facialHair()}
  {a.expression==="happy"?<><ellipse cx="35" cy="62" rx="5" ry="3" fill="#D98375" opacity=".3"/><ellipse cx="77" cy="62" rx="5" ry="3" fill="#D98375" opacity=".3"/></>:null}
  {accessory()}
 </svg>;
}

function ColorChoices({values,value,onChange,label}:{values:readonly string[];value:string;onChange:(v:string)=>void;label:string}){return <div className={styles.group}><span className={styles.label}>{label}</span><div className={styles.swatches}>{values.map((v,i)=><button key={v} type="button" className={`${styles.swatch} ${value===v?styles.selected:""}`} aria-label={`${label} option ${i+1}`} aria-pressed={value===v} onClick={()=>onChange(v)}><span style={{background:v}}/>{value===v?<b>✓</b>:null}</button>)}</div></div>}
function TextChoices({values,value,onChange,label}:{values:readonly string[];value:string;onChange:(v:string)=>void;label:string}){return <div className={styles.group}><span className={styles.label}>{label}</span><div className={styles.choices}>{values.map(v=><button key={v} type="button" className={`${styles.choice} ${value===v?styles.selected:""}`} aria-pressed={value===v} onClick={()=>onChange(v)}>{labels[v]||v}</button>)}</div></div>}

export function AvatarEditor({initial}:{initial:AvatarConfig}){
 const [avatar,setAvatar]=useState(()=>normalizeAvatar(initial));const [tab,setTab]=useState<Tab>("face");
 const set=(key:keyof AvatarConfig,value:string)=>setAvatar(v=>({...v,[key]:value}));
 const reset=()=>setAvatar(defaultAvatar);
 return <div className={styles.wrap} id="avatar-editor">
  <input type="hidden" name="avatarConfig" value={JSON.stringify(avatar)}/>
  <aside className={styles.previewPane}>
   <div className={styles.badge}><Sparkles size={14}/>HomeTayo Avatar Studio</div>
   <div className={styles.avatarStage}><AvatarFace config={avatar} size={196}/></div>
   <h3 className={styles.title}>Make it unmistakably you.</h3>
   <p className={styles.help}>Build a polished profile character that appears across HomeTayo when you use an avatar instead of a photo.</p>
   <div className={styles.previewActions}><button className={styles.random} type="button" onClick={()=>setAvatar(randomAvatar())}><RefreshCw size={15}/>Surprise me</button><button className={styles.reset} type="button" onClick={reset}><RotateCcw size={15}/>Reset</button></div>
  </aside>
  <section className={styles.editorPane}>
   <div className={styles.tabs} role="tablist" aria-label="Avatar customization categories">
    {([ ["face","Face"],["hair","Hair"],["style","Style"],["extras","Extras"] ] as const).map(([id,label])=><button key={id} type="button" role="tab" aria-selected={tab===id} className={`${styles.tab} ${tab===id?styles.activeTab:""}`} onClick={()=>setTab(id)}>{label}</button>)}
   </div>
   <div className={styles.controls}>
    {tab==="face"&&<><ColorChoices label="Skin tone" values={avatarOptions.skin} value={avatar.skin} onChange={v=>set("skin",v)}/><TextChoices label="Face shape" values={avatarOptions.faceShape} value={avatar.faceShape} onChange={v=>set("faceShape",v)}/><TextChoices label="Eyebrows" values={avatarOptions.brows} value={avatar.brows} onChange={v=>set("brows",v)}/><TextChoices label="Expression" values={avatarOptions.expression} value={avatar.expression} onChange={v=>set("expression",v)}/></>}
    {tab==="hair"&&<><TextChoices label="Hair style" values={avatarOptions.hair} value={avatar.hair} onChange={v=>set("hair",v)}/><ColorChoices label="Hair color" values={avatarOptions.hairColor} value={avatar.hairColor} onChange={v=>set("hairColor",v)}/><TextChoices label="Facial hair" values={avatarOptions.facialHair} value={avatar.facialHair} onChange={v=>set("facialHair",v)}/></>}
    {tab==="style"&&<><TextChoices label="Outfit" values={avatarOptions.outfitStyle} value={avatar.outfitStyle} onChange={v=>set("outfitStyle",v)}/><ColorChoices label="Outfit color" values={avatarOptions.outfit} value={avatar.outfit} onChange={v=>set("outfit",v)}/><ColorChoices label="Background" values={avatarOptions.background} value={avatar.background} onChange={v=>set("background",v)}/></>}
    {tab==="extras"&&<><TextChoices label="Accessories" values={avatarOptions.accessory} value={avatar.accessory} onChange={v=>set("accessory",v)}/><div className={styles.tip}><Sparkles size={17}/><div><strong>Profile-ready everywhere</strong><p>Your saved avatar is synced to your account and can be reused across messages, rentals and reviews.</p></div></div></>}
   </div>
  </section>
 </div>;
}
