import React from "react";
import Svg,{Circle,Ellipse,G,Path,Rect} from "react-native-svg";

export type AvatarConfig={
  skin:string;faceShape:string;hair:string;hairColor:string;brows:string;facialHair:string;outfit:string;outfitStyle:string;accessory:string;background:string;expression:string;
};

export const avatarOptions={
  skin:["#FBE0CF","#F7D7C4","#F3C6A8","#E8B894","#D99A70","#C9825A","#A96649","#9A5B3E","#7A4937","#5D372A","#513027"],
  faceShape:["oval","round","soft-square","heart"],
  hair:["crop","waves","bun","spikes","curly","bob","fade","braids","ponytail","buzz"],
  hairColor:["#171717","#33251F","#51352A","#70422C","#8B4A2B","#B56C34","#D19A4A","#7D7270","#5B3B7D"],
  brows:["soft","straight","arched","bold"],
  facialHair:["none","stubble","mustache","goatee","beard"],
  outfit:["#1F6F50","#2F67C7","#E4813D","#7A55B5","#D75A75","#303846","#B94B43","#2B8B8B","#C99A34"],
  outfitStyle:["tee","collared","hoodie","sweater","blazer"],
  accessory:["none","round-glasses","square-glasses","earrings","cap","headband"],
  background:["#DFF4E8","#DCEEFF","#FFE6D5","#EEE2FF","#FFF1BF","#E7EBEE","#DDEDE9","#F7DEEA","#E9E4D7"],
  expression:["smile","happy","wink","calm","confident","cool"],
} as const;

export const defaultAvatar:AvatarConfig={skin:"#E8B894",faceShape:"oval",hair:"waves",hairColor:"#171717",brows:"soft",facialHair:"none",outfit:"#1F6F50",outfitStyle:"tee",accessory:"none",background:"#DFF4E8",expression:"smile"};

export function normalizeAvatar(value:unknown):AvatarConfig{
  const input=value&&typeof value==="object"?value as Record<string,unknown>:{};
  const pick=(key:keyof typeof avatarOptions,fallback:string)=>{const candidate=input[key];return typeof candidate==="string"&&(avatarOptions[key] as readonly string[]).includes(candidate)?candidate:fallback;};
  return {skin:pick("skin",defaultAvatar.skin),faceShape:pick("faceShape",defaultAvatar.faceShape),hair:pick("hair",defaultAvatar.hair),hairColor:pick("hairColor",defaultAvatar.hairColor),brows:pick("brows",defaultAvatar.brows),facialHair:pick("facialHair",defaultAvatar.facialHair),outfit:pick("outfit",defaultAvatar.outfit),outfitStyle:pick("outfitStyle",defaultAvatar.outfitStyle),accessory:pick("accessory",defaultAvatar.accessory),background:pick("background",defaultAvatar.background),expression:pick("expression",defaultAvatar.expression)};
}

export function randomAvatar():AvatarConfig{
  const random=<T,>(values:readonly T[])=>values[Math.floor(Math.random()*values.length)];
  return {skin:random(avatarOptions.skin),faceShape:random(avatarOptions.faceShape),hair:random(avatarOptions.hair),hairColor:random(avatarOptions.hairColor),brows:random(avatarOptions.brows),facialHair:random(avatarOptions.facialHair),outfit:random(avatarOptions.outfit),outfitStyle:random(avatarOptions.outfitStyle),accessory:random(avatarOptions.accessory),background:random(avatarOptions.background),expression:random(avatarOptions.expression)};
}

function faceDimensions(shape:string){if(shape==="round")return {rx:30,ry:30};if(shape==="soft-square")return {rx:27,ry:33};return {rx:28,ry:34};}

export function Avatar({config,size=112}:{config:AvatarConfig;size?:number}){
  const a=normalizeAvatar(config),face=faceDimensions(a.faceShape);
  const hair=()=>{
    if(a.hair==="crop")return <Path d="M27 43c1-19 14-30 29-30s28 12 29 30c-8-9-17-13-29-13S35 34 27 43Z" fill={a.hairColor}/>;
    if(a.hair==="waves")return <Path d="M24 45c1-22 14-33 31-33 19 0 31 12 32 35-8-3-11-12-14-18-4 8-10 12-18 12-8 0-14-4-18-11-2 7-5 12-13 15Z" fill={a.hairColor}/>;
    if(a.hair==="bun")return <G><Circle cx="57" cy="13" r="12" fill={a.hairColor}/><Path d="M27 45c1-20 13-31 29-31 17 0 29 11 30 31-8-10-18-15-30-15S35 35 27 45Z" fill={a.hairColor}/></G>;
    if(a.hair==="spikes")return <Path d="M23 45 29 18l8 8 6-16 10 13 8-15 7 18 12-10 7 31c-7-10-18-17-31-17-14 0-25 6-33 15Z" fill={a.hairColor}/>;
    if(a.hair==="bob")return <Path d="M24 50c0-25 13-39 32-39 20 0 33 14 33 40v17l-11-5V42c-5-10-12-15-22-15-11 0-19 5-23 15v22l-9 5Z" fill={a.hairColor}/>;
    if(a.hair==="fade")return <G><Path d="M29 38c3-17 13-26 28-26 14 0 24 8 28 24-9-4-17-6-28-6-10 0-19 3-28 8Z" fill={a.hairColor}/><Path d="M28 34v18M85 34v18" stroke={a.hairColor} strokeWidth="5" strokeLinecap="round"/></G>;
    if(a.hair==="braids")return <G><Path d="M27 43c2-20 13-31 29-31 17 0 29 11 30 31-8-9-18-14-30-14-11 0-21 5-29 14Z" fill={a.hairColor}/><Path d="M31 38c-6 10-5 23-8 33M81 38c6 10 5 23 8 33" stroke={a.hairColor} strokeWidth="6" strokeLinecap="round" fill="none"/></G>;
    if(a.hair==="ponytail")return <G><Circle cx="88" cy="34" r="13" fill={a.hairColor}/><Path d="M27 44c2-20 13-31 29-31 17 0 29 11 30 31-8-9-18-14-30-14S35 35 27 44Z" fill={a.hairColor}/></G>;
    if(a.hair==="buzz")return <Path d="M29 38c3-16 13-25 28-25 14 0 24 8 27 24-8-5-17-7-28-7-10 0-19 3-27 8Z" fill={a.hairColor} opacity={.92}/>;
    return <G>{[[31,29,11],[43,20,12],[56,18,13],[69,22,12],[79,31,11],[34,39,12],[49,34,13],[65,35,13]].map(([cx,cy,r],i)=><Circle key={i} cx={cx} cy={cy} r={r} fill={a.hairColor}/>)}</G>;
  };
  const brows=()=>{const width=a.brows==="bold"?3.4:2.4;if(a.brows==="straight")return <G><Path d="M38 46h14M61 46h14" stroke="#45342D" strokeWidth={width} strokeLinecap="round"/></G>;if(a.brows==="arched")return <G><Path d="M38 47q7-7 14 0M61 47q7-7 14 0" stroke="#45342D" strokeWidth={width} strokeLinecap="round" fill="none"/></G>;return <G><Path d="M38 47q7-4 14 0M61 47q7-4 14 0" stroke="#45342D" strokeWidth={width} strokeLinecap="round" fill="none"/></G>;};
  const eyes=()=>{if(a.expression==="wink")return <G><Path d="M40 55q5-5 10 0" stroke="#30241E" strokeWidth="2.8" strokeLinecap="round" fill="none"/><Circle cx="68" cy="54" r="2.6" fill="#30241E"/></G>;if(a.expression==="cool")return <G><Path d="M40 54h10M63 54h10" stroke="#30241E" strokeWidth="3" strokeLinecap="round"/></G>;if(a.expression==="calm")return <G><Path d="M40 54q5 3 10 0M63 54q5 3 10 0" stroke="#30241E" strokeWidth="2.5" strokeLinecap="round" fill="none"/></G>;return <G><Circle cx="45" cy="54" r="2.6" fill="#30241E"/><Circle cx="68" cy="54" r="2.6" fill="#30241E"/></G>;};
  const facialHair=()=>{if(a.facialHair==="stubble")return <Path d="M43 65q13 12 26 0M45 70q11 7 22 0" stroke={a.hairColor} strokeWidth="1.2" strokeDasharray="1 3" opacity={.7} fill="none"/>;if(a.facialHair==="mustache")return <Path d="M48 65q8-6 16 0-4 5-8 1-4 4-8-1Z" fill={a.hairColor}/>;if(a.facialHair==="goatee")return <G><Path d="M48 65q8-6 16 0-4 5-8 1-4 4-8-1Z" fill={a.hairColor}/><Path d="M51 72q5 8 10 0" stroke={a.hairColor} strokeWidth="4" strokeLinecap="round"/></G>;if(a.facialHair==="beard")return <Path d="M37 62q2 27 19 31 17-4 20-31-7 13-20 13T37 62Z" fill={a.hairColor} opacity={.9}/>;return null;};
  const outfit=()=>{if(a.outfitStyle==="collared")return <G><Path d="M20 112c2-24 16-37 36-37s34 13 36 37" fill={a.outfit}/><Path d="m45 78 11 13 11-13-4 18H49Z" fill="#fff" opacity={.92}/></G>;if(a.outfitStyle==="hoodie")return <G><Path d="M18 112c2-25 16-38 38-38s36 13 38 38" fill={a.outfit}/><Path d="M38 80q18-13 36 0-4 16-18 16S42 90 38 80Z" fill="none" stroke="#fff" strokeWidth="2" opacity={.55}/></G>;if(a.outfitStyle==="sweater")return <G><Path d="M18 112c2-25 16-38 38-38s36 13 38 38" fill={a.outfit}/><Path d="M42 78q14 10 28 0" stroke="#fff" strokeWidth="3" opacity={.5} fill="none"/></G>;if(a.outfitStyle==="blazer")return <G><Path d="M17 112c3-24 18-37 39-37s36 13 39 37" fill={a.outfit}/><Path d="m41 78 15 17 15-17-8 28H49Z" fill="#fff" opacity={.9}/></G>;return <Path d="M17 112c3-24 18-37 39-37s36 13 39 37Z" fill={a.outfit}/>;};
  const accessory=()=>{if(a.accessory==="round-glasses")return <G><Circle cx="45" cy="54" r="8" fill="none" stroke="#25323C" strokeWidth="2"/><Circle cx="68" cy="54" r="8" fill="none" stroke="#25323C" strokeWidth="2"/><Path d="M53 54h7" stroke="#25323C" strokeWidth="2"/></G>;if(a.accessory==="square-glasses")return <G><Rect x="36" y="47" width="18" height="14" rx="4" fill="none" stroke="#25323C" strokeWidth="2"/><Rect x="59" y="47" width="18" height="14" rx="4" fill="none" stroke="#25323C" strokeWidth="2"/><Path d="M54 53h5" stroke="#25323C" strokeWidth="2"/></G>;if(a.accessory==="earrings")return <G><Circle cx="27" cy="61" r="2.8" fill="#D4A72C"/><Circle cx="85" cy="61" r="2.8" fill="#D4A72C"/></G>;if(a.accessory==="cap")return <G><Path d="M28 32q4-21 28-21 22 0 29 20-28-10-57 1Z" fill={a.outfit}/><Path d="M61 28q19-3 30 5-15 2-29 0Z" fill={a.outfit}/></G>;if(a.accessory==="headband")return <Path d="M28 31q28-12 57 0" stroke={a.outfit} strokeWidth="7" strokeLinecap="round" fill="none"/>;return null;};
  const mouth=a.expression==="happy"?"M43 66q13 13 26 0":a.expression==="confident"?"M47 67q10 2 20-2":a.expression==="calm"?"M48 68h16":a.expression==="cool"?"M47 68q9 5 18 0":"M46 67q10 8 20 0";
  return <Svg width={size} height={size} viewBox="0 0 112 112" accessibilityLabel="Custom HomeTayo avatar">
    <Rect width="112" height="112" rx="26" fill={a.background}/><Circle cx="92" cy="19" r="17" fill="#fff" opacity={.18}/><Circle cx="18" cy="93" r="24" fill="#fff" opacity={.12}/>
    {outfit()}<Path d="M47 72h18v15H47Z" fill={a.skin}/><Circle cx="28" cy="55" r="6.5" fill={a.skin}/><Circle cx="84" cy="55" r="6.5" fill={a.skin}/><Ellipse cx="56" cy="52" rx={face.rx} ry={face.ry} fill={a.skin}/>{a.faceShape==="heart"?<Path d="M35 68q21 25 42 0-6 19-21 22-15-3-21-22Z" fill={a.skin}/>:null}
    {hair()}{brows()}{eyes()}<Path d={mouth} stroke="#8E4635" strokeWidth="2.7" strokeLinecap="round" fill="none"/>{facialHair()}{a.expression==="happy"?<G><Ellipse cx="35" cy="62" rx="5" ry="3" fill="#D98375" opacity={.3}/><Ellipse cx="77" cy="62" rx="5" ry="3" fill="#D98375" opacity={.3}/></G>:null}{accessory()}
  </Svg>;
}
