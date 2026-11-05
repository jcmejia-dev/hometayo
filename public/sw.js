/* HomeTayo public PWA offline shell. Never cache authenticated HTML or private APIs. */
const SHELL_CACHE="hometayo-offline-shell-v1";
const OFFLINE_URL="/offline.html";
self.addEventListener("install",event=>{
 event.waitUntil(caches.open(SHELL_CACHE).then(cache=>cache.addAll([OFFLINE_URL,"/pwa-icon-192.png"])).then(()=>self.skipWaiting()));
});
self.addEventListener("activate",event=>{
 event.waitUntil(Promise.all([
  caches.keys().then(keys=>Promise.all(keys.filter(key=>key.startsWith("hometayo-offline-shell-")&&key!==SHELL_CACHE).map(key=>caches.delete(key)))),
  self.clients.claim()
 ]));
});
self.addEventListener("fetch",event=>{
 const request=event.request;
 if(request.method!=="GET"||request.mode!=="navigate")return;
 const url=new URL(request.url);
 if(url.origin!==self.location.origin)return;
 // Network-first navigation: never persist sign-in, inbox, profile, or other private pages.
 event.respondWith((async()=>{
  const controller=new AbortController();
  const timeout=setTimeout(()=>controller.abort(),7000);
  try{return await fetch(request,{signal:controller.signal});}
  catch{
   const cache=await caches.open(SHELL_CACHE);
   return await cache.match(OFFLINE_URL)||new Response("HomeTayo is offline. Reconnect and try again.",{status:503,headers:{"Content-Type":"text/plain; charset=utf-8"}});
  }finally{clearTimeout(timeout);}
 })());
});
