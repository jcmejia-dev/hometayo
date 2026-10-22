import React from "react";
import Svg,{Circle,Ellipse,G,Path,Rect} from "react-native-svg";

export type AvatarConfig={
  skin:string;
  hair:string;
  hairColor:string;
  outfit:string;
  background:string;
  expression:string;
};

export const avatarOptions={
  skin:["#F7D7C4","#E8B894","#C9825A","#9A5B3E","#5D372A"],
  hair:["crop","waves","bun","spikes","curly"],
  hairColor:["#171717","#51352A","#8B4A2B","#D19A4A","#5B3B7D"],
  outfit:["#1F6F50","#2F67C7","#E4813D","#7A55B5","#D75A75","#303846"],
  background:["#DFF4E8","#DCEEFF","#FFE6D5","#EEE2FF","#FFF1BF","#E7EBEE"],
  expression:["smile","happy","wink","cool"],
} as const;

export const defaultAvatar:AvatarConfig={
  skin:avatarOptions.skin[1],hair:"waves",hairColor:avatarOptions.hairColor[0],outfit:avatarOptions.outfit[0],background:avatarOptions.background[0],expression:"smile",
};

export function normalizeAvatar(value:unknown):AvatarConfig{
  const input=value&&typeof value==="object"?value as Record<string,unknown>:{};
  const pick=(key:keyof typeof avatarOptions,fallback:string)=>{
    const candidate=input[key];
    return typeof candidate==="string"&&(avatarOptions[key] as readonly string[]).includes(candidate)?candidate:fallback;
  };
  return {
    skin:pick("skin",defaultAvatar.skin),hair:pick("hair",defaultAvatar.hair),hairColor:pick("hairColor",defaultAvatar.hairColor),outfit:pick("outfit",defaultAvatar.outfit),background:pick("background",defaultAvatar.background),expression:pick("expression",defaultAvatar.expression),
  };
}

export function randomAvatar():AvatarConfig{
  const random=<T,>(values:readonly T[])=>values[Math.floor(Math.random()*values.length)];
  return {skin:random(avatarOptions.skin),hair:random(avatarOptions.hair),hairColor:random(avatarOptions.hairColor),outfit:random(avatarOptions.outfit),background:random(avatarOptions.background),expression:random(avatarOptions.expression)};
}

export function Avatar({config,size=112}:{config:AvatarConfig;size?:number}){
  const a=normalizeAvatar(config);
  const hair=()=>{
    if(a.hair==="crop")return <Path d="M27 43c1-19 14-30 29-30s28 12 29 30c-8-9-17-13-29-13S35 34 27 43Z" fill={a.hairColor}/>;
    if(a.hair==="waves")return <Path d="M24 45c1-22 14-33 31-33 19 0 31 12 32 35-8-3-11-12-14-18-4 8-10 12-18 12-8 0-14-4-18-11-2 7-5 12-13 15Z" fill={a.hairColor}/>;
    if(a.hair==="bun")return <G><Circle cx="57" cy="14" r="12" fill={a.hairColor}/><Path d="M27 45c1-20 13-31 29-31 17 0 29 11 30 31-8-10-18-15-30-15S35 35 27 45Z" fill={a.hairColor}/></G>;
    if(a.hair==="spikes")return <Path d="M23 45 29 18l8 8 6-16 10 13 8-15 7 18 12-10 7 31c-7-10-18-17-31-17-14 0-25 6-33 15Z" fill={a.hairColor}/>;
    return <G>{[[31,29,11],[43,20,12],[56,18,13],[69,22,12],[79,31,11],[34,39,12],[49,34,13],[65,35,13]].map(([cx,cy,r],i)=><Circle key={i} cx={cx} cy={cy} r={r} fill={a.hairColor}/>)}</G>;
  };
  const eyes=()=>{
    if(a.expression==="wink")return <><Path d="M40 54q5-5 10 0" stroke="#30241E" strokeWidth="2.8" strokeLinecap="round" fill="none"/><Circle cx="68" cy="53" r="2.6" fill="#30241E"/></>;
    if(a.expression==="cool")return <><Rect x="36" y="49" width="17" height="9" rx="4" fill="#25323C"/><Rect x="61" y="49" width="17" height="9" rx="4" fill="#25323C"/><Path d="M53 52h8" stroke="#25323C" strokeWidth="3"/></>;
    return <><Circle cx="45" cy="53" r="2.6" fill="#30241E"/><Circle cx="69" cy="53" r="2.6" fill="#30241E"/></>;
  };
  return <Svg width={size} height={size} viewBox="0 0 112 112" accessibilityLabel="Custom HomeTayo avatar">
    <Circle cx="56" cy="56" r="56" fill={a.background}/>
    <Path d="M17 112c3-24 18-37 39-37s36 13 39 37Z" fill={a.outfit}/>
    <Path d="M46 73h20v18H46Z" fill={a.skin}/>
    <Circle cx="28" cy="55" r="7" fill={a.skin}/><Circle cx="84" cy="55" r="7" fill={a.skin}/>
    <Ellipse cx="56" cy="52" rx="29" ry="34" fill={a.skin}/>
    {hair()}
    {eyes()}
    <Path d={a.expression==="happy"?"M44 65q12 13 24 0":a.expression==="cool"?"M48 67q8 5 16 0":"M47 66q9 8 18 0"} stroke="#8E4E48" strokeWidth="2.8" strokeLinecap="round" fill="none"/>
    {a.expression==="happy"?<><Circle cx="36" cy="63" r="4" fill="#E9948E" opacity=".35"/><Circle cx="77" cy="63" r="4" fill="#E9948E" opacity=".35"/></>:null}
  </Svg>;
}
