export type AvatarConfig={skin:string;hair:string;hairColor:string;outfit:string;background:string;expression:string};
export const avatarOptions={
 skin:["#F7D7C4","#E8B894","#C9825A","#9A5B3E","#5D372A"],
 hair:["crop","waves","bun","spikes","curly"],
 hairColor:["#171717","#51352A","#8B4A2B","#D19A4A","#5B3B7D"],
 outfit:["#1F6F50","#2F67C7","#E4813D","#7A55B5","#D75A75","#303846"],
 background:["#DFF4E8","#DCEEFF","#FFE6D5","#EEE2FF","#FFF1BF","#E7EBEE"],
 expression:["smile","happy","wink","cool"],
} as const;
export const defaultAvatar:AvatarConfig={skin:"#E8B894",hair:"waves",hairColor:"#171717",outfit:"#1F6F50",background:"#DFF4E8",expression:"smile"};
export function normalizeAvatar(value:unknown):AvatarConfig{
 const input=value&&typeof value==="object"?value as Record<string,unknown>:{};
 const pick=(key:keyof typeof avatarOptions,fallback:string)=>{const candidate=input[key];return typeof candidate==="string"&&(avatarOptions[key] as readonly string[]).includes(candidate)?candidate:fallback;};
 return {skin:pick("skin",defaultAvatar.skin),hair:pick("hair",defaultAvatar.hair),hairColor:pick("hairColor",defaultAvatar.hairColor),outfit:pick("outfit",defaultAvatar.outfit),background:pick("background",defaultAvatar.background),expression:pick("expression",defaultAvatar.expression)};
}
export function randomAvatar():AvatarConfig{const random=<T,>(values:readonly T[])=>values[Math.floor(Math.random()*values.length)];return {skin:random(avatarOptions.skin),hair:random(avatarOptions.hair),hairColor:random(avatarOptions.hairColor),outfit:random(avatarOptions.outfit),background:random(avatarOptions.background),expression:random(avatarOptions.expression)};}
