import {isPoint,type Point} from "./geo.ts";
export function readPropertyPin(latitude:string,longitude:string):Point|null{
 const lat=latitude.trim(),lng=longitude.trim();
 if(!lat&&!lng)return null;
 if(!lat||!lng)throw Error("Select a complete property location.");
 const point={latitude:Number(lat),longitude:Number(lng)};
 if(!isPoint(point))throw Error("Select a valid property location.");
 return point;
}
