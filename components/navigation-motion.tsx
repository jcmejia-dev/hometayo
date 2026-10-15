"use client";
import {useEffect,useLayoutEffect,useRef} from "react";
import {usePathname,useRouter} from "next/navigation";
export function NavigationMotion(){
 const pathname=usePathname(),router=useRouter(),pending=useRef<(()=>void)|null>(null);
 useLayoutEffect(()=>{pending.current?.();pending.current=null;document.querySelectorAll<HTMLAnchorElement>("nav a").forEach(link=>{if(new URL(link.href).pathname===pathname)link.setAttribute("aria-current","page");else link.removeAttribute("aria-current");});},[pathname]);
 useEffect(()=>{
  if(!document.startViewTransition)return;
  document.documentElement.dataset.viewTransitions="true";
  let active:ViewTransition|null=null,timer:ReturnType<typeof setTimeout>|null=null;
  function click(event:MouseEvent){
   if(event.defaultPrevented||event.button!==0||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey||matchMedia("(prefers-reduced-motion: reduce)").matches)return;
   const anchor=(event.target as Element).closest<HTMLAnchorElement>("a[href]");
   if(!anchor||anchor.target&&anchor.target!=="_self"||anchor.hasAttribute("download")||anchor.closest('[data-no-transition]'))return;
   const url=new URL(anchor.href);
   if(url.origin!==location.origin||url.pathname===location.pathname||url.pathname.startsWith("/api/")||url.pathname.endsWith(".apk"))return;
   event.preventDefault();active?.skipTransition();pending.current?.();if(timer)clearTimeout(timer);
   document.documentElement.dataset.motion="page";
   const transition=document.startViewTransition(()=>new Promise<void>(resolve=>{pending.current=resolve;router.push(url.pathname+url.search+url.hash);timer=setTimeout(()=>{resolve();transition.skipTransition();},2500);}));active=transition;
   void transition.ready.catch(()=>{});
   void transition.finished.catch(()=>{}).finally(()=>{if(active===transition){if(timer)clearTimeout(timer);pending.current=null;delete document.documentElement.dataset.motion;active=null;}});
  }
  document.addEventListener("click",click,true);
  return()=>{document.removeEventListener("click",click,true);active?.skipTransition();pending.current?.();if(timer)clearTimeout(timer);};
 },[router]);
 return null;
}
