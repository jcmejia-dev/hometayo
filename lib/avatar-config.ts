export type AvatarConfig={
 skin:string;
 faceShape:string;
 hair:string;
 hairColor:string;
 brows:string;
 facialHair:string;
 outfit:string;
 outfitStyle:string;
 accessory:string;
 background:string;
 expression:string;
};

export const avatarOptions={
 skin:["#FBE0CF","#F3C6A8","#E8B894","#D99A70","#C9825A","#A96649","#7A4937","#513027"],
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

export const defaultAvatar:AvatarConfig={
 skin:"#E8B894",
 faceShape:"oval",
 hair:"waves",
 hairColor:"#171717",
 brows:"soft",
 facialHair:"none",
 outfit:"#1F6F50",
 outfitStyle:"tee",
 accessory:"none",
 background:"#DFF4E8",
 expression:"smile",
};

export function normalizeAvatar(value:unknown):AvatarConfig{
 const input=value&&typeof value==="object"?value as Record<string,unknown>:{};
 const pick=(key:keyof typeof avatarOptions,fallback:string)=>{
  const candidate=input[key];
  return typeof candidate==="string"&&(avatarOptions[key] as readonly string[]).includes(candidate)?candidate:fallback;
 };
 return {
  skin:pick("skin",defaultAvatar.skin),
  faceShape:pick("faceShape",defaultAvatar.faceShape),
  hair:pick("hair",defaultAvatar.hair),
  hairColor:pick("hairColor",defaultAvatar.hairColor),
  brows:pick("brows",defaultAvatar.brows),
  facialHair:pick("facialHair",defaultAvatar.facialHair),
  outfit:pick("outfit",defaultAvatar.outfit),
  outfitStyle:pick("outfitStyle",defaultAvatar.outfitStyle),
  accessory:pick("accessory",defaultAvatar.accessory),
  background:pick("background",defaultAvatar.background),
  expression:pick("expression",defaultAvatar.expression),
 };
}

export function randomAvatar():AvatarConfig{
 const random=<T,>(values:readonly T[])=>values[Math.floor(Math.random()*values.length)];
 return {
  skin:random(avatarOptions.skin),
  faceShape:random(avatarOptions.faceShape),
  hair:random(avatarOptions.hair),
  hairColor:random(avatarOptions.hairColor),
  brows:random(avatarOptions.brows),
  facialHair:random(avatarOptions.facialHair),
  outfit:random(avatarOptions.outfit),
  outfitStyle:random(avatarOptions.outfitStyle),
  accessory:random(avatarOptions.accessory),
  background:random(avatarOptions.background),
  expression:random(avatarOptions.expression),
 };
}
