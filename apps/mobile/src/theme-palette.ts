export type Palette={green:string;green2:string;cream:string;white:string;ink:string;sage:string;soft:string;muted:string;border:string;gold:string;danger:string;field:string};
export const themes=[
{id:"forest",name:"Forest",accent:"#173D32",soft:"#E8F0E7",background:"#F8F7F2",palette:{green:"#173D32",green2:"#265A45",cream:"#F8F7F2",white:"#FFFFFF",ink:"#17372B",sage:"#668B73",soft:"#E8F0E7",muted:"#698074",border:"#DCE8DE",gold:"#C59A56",danger:"#B05C47",field:"#F7FAF6"}},
{id:"ocean",name:"Ocean",accent:"#174E70",soft:"#E5EFF5",background:"#F4F7F9",palette:{green:"#174E70",green2:"#286586",cream:"#F4F7F9",white:"#FFFFFF",ink:"#203544",sage:"#477D99",soft:"#E5EFF5",muted:"#526D80",border:"#D8E4EC",gold:"#C59A56",danger:"#B05C47",field:"#F6F9FC"}},
{id:"plum",name:"Plum",accent:"#633C68",soft:"#F0E7F1",background:"#F9F5F8",palette:{green:"#633C68",green2:"#7D5183",cream:"#F9F5F8",white:"#FFFFFF",ink:"#3B2B3E",sage:"#946E98",soft:"#F0E7F1",muted:"#77627B",border:"#E5D9E7",gold:"#C59A56",danger:"#B05C47",field:"#FCF8FC"}}
];
export function mixColor(a:string,b:string,t:number){const channel=(i:number)=>Math.round(parseInt(a.slice(i,i+2),16)*(1-t)+parseInt(b.slice(i,i+2),16)*t).toString(16).padStart(2,"0");return "#"+channel(1)+channel(3)+channel(5);}
export function paletteAt(from:Palette,to:Palette,t:number):Palette{return Object.fromEntries(Object.keys(to).map(key=>[key,mixColor(from[key as keyof Palette],to[key as keyof Palette],Math.max(0,Math.min(1,t)))])) as Palette;}
export function themeColor(value:string,palette:Palette):string {
 const known=Object.entries(themes[0].palette).find(([,color])=>color.toLowerCase()===value.toLowerCase());
 if(known)return palette[known[0] as keyof Palette];
 return value;
}
export function themedStyles<T>(styles:T,palette:Palette):T{
 if(typeof styles==="string")return themeColor(styles,palette) as T;
 if(Array.isArray(styles))return styles.map(value=>themedStyles(value,palette)) as T;
 if(styles&&typeof styles==="object")return Object.fromEntries(Object.entries(styles).map(([key,value])=>[key,themedStyles(value,palette)])) as T;
 return styles;
}
