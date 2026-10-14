export type Point = { latitude:number; longitude:number };
export function isPoint(value:unknown):value is Point {
  if (!value || typeof value !== "object") return false;
  const p=value as Point;
  return Number.isFinite(p.latitude) && Number.isFinite(p.longitude) && Math.abs(p.latitude)<=90 && Math.abs(p.longitude)<=180;
}
export function distanceKm(a:Point,b:Point):number {
  const rad=(v:number)=>v*Math.PI/180;
  const dlat=rad(b.latitude-a.latitude),dlng=rad(b.longitude-a.longitude);
  const h=Math.sin(dlat/2)**2+Math.cos(rad(a.latitude))*Math.cos(rad(b.latitude))*Math.sin(dlng/2)**2;
  return 6371*2*Math.asin(Math.sqrt(Math.max(0,Math.min(1,h))));
}
