let pending:Promise<typeof google.maps>|null=null;
type MapWindow=Window&{google?:typeof google;hometayoMapReady?:()=>void;gm_authFailure?:()=>void};
export function loadGoogleMap(key:string):Promise<typeof google.maps>{
 const w=window as MapWindow;
 if(w.google?.maps?.Map)return Promise.resolve(w.google.maps);
 if(pending)return pending;
 pending=new Promise((resolve,reject)=>{
  const script=document.createElement("script");
  const timeout=setTimeout(()=>fail(),20000);
  function fail(){clearTimeout(timeout);script.remove();pending=null;reject(Error("The map could not load. You can still search an address or use your current location."));}
  w.hometayoMapReady=()=>{clearTimeout(timeout);if(w.google?.maps)resolve(w.google.maps);else fail();};
  w.gm_authFailure=()=>{window.dispatchEvent(new Event("hometayo-map-error"));fail();};
  const params=new URLSearchParams({key,loading:"async",callback:"hometayoMapReady",v:"quarterly",region:"PH"});
  script.src="https://maps.googleapis.com/maps/api/js?"+params;script.async=true;script.onerror=fail;document.head.append(script);
 });
 return pending;
}
