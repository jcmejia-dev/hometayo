import type {RentalDetail} from "./api";

export type DemoRental=RentalDetail&{demo:true;inclusions:string[];latitude:number;longitude:number};
export const demoLandmarks=[
  {id:"demo-mall",name:"Demo shopping centre",address:"Fictional test landmark, Koronadal City",latitude:6.497,longitude:124.846},
  {id:"demo-school",name:"Demo school",address:"Fictional test landmark, Koronadal City",latitude:6.516,longitude:124.854},
];
const samples: Array<[string,DemoRental["propertyType"],number,number,number,number,string[]]>=[
  ["Garden house","house",8500,2,1,.002,["Private kitchen","Parking space","Laundry area","Water included"]],
  ["Family house","house",12000,3,2,.009,["Fenced yard","Parking space","Private kitchen","Pets allowed"]],
  ["Studio apartment","apartment",6500,1,1,.004,["Air conditioning","Wi-Fi included","Private bathroom","Kitchenette"]],
  ["Student boarding house","boarding_house",3500,1,1,.018,["Shared kitchen","Wi-Fi included","Water included","Study area"]],
  ["Shared bedspace","bedspace",2000,1,1,.025,["Bed and mattress","Shared bathroom","Lockers","Wi-Fi included"]],
  ["Quiet hillside house","house",10000,2,1,.065,["Balcony","Private kitchen","Parking space","Laundry area"]],
];
export const demoRentals:DemoRental[]=samples.map(([name,propertyType,rent,bedrooms,bathrooms,offset,inclusions],index)=>({
  slug:"demo-"+name.toLowerCase().replaceAll(" ","-"),title:name+" (demo)",propertyType,
  city:"Koronadal City",barangay:"Demo neighbourhood",province:"South Cotabato",
  monthlyRentCentavos:rent*100,bedrooms,bathrooms,rentalMode:"monthly",lastConfirmedAt:null,
  description:"Fictional rental for testing HomeTayo. This is not an actual property or an offer to rent. Utilities not listed as included are paid separately.",
  furnished:index===2||index===4?"yes":"no",availableSlots:propertyType==="bedspace"?4:null,contactUrl:null,
  demo:true,inclusions,latitude:demoLandmarks[0].latitude+offset,longitude:demoLandmarks[0].longitude+(index%2?offset/2:-offset/2),
}));
export function distanceKm(a:{latitude:number;longitude:number},b:{latitude:number;longitude:number}){
  const rad=(v:number)=>v*Math.PI/180;
  const h=Math.sin(rad(b.latitude-a.latitude)/2)**2+Math.cos(rad(a.latitude))*Math.cos(rad(b.latitude))*Math.sin(rad(b.longitude-a.longitude)/2)**2;
  return 12742*Math.asin(Math.sqrt(Math.max(0,Math.min(1,h))));
}
export function selectDemoRentals(center:{latitude:number;longitude:number}|null,radius:number,city:string,type:string){
  return demoRentals.filter(r=>(!city.trim()||r.city.toLowerCase()===city.trim().toLowerCase())&&(!type||r.propertyType===type))
    .map(r=>({...r,distanceKm:center?distanceKm(center,r):null}))
    .filter(r=>r.distanceKm===null||r.distanceKm<=radius)
    .sort((a,b)=>(a.distanceKm??0)-(b.distanceKm??0));
}
