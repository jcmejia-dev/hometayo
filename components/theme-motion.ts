import {flushSync} from "react-dom";
let active:ViewTransition|null=null;
export function revealTheme(commit:()=>void,trigger:HTMLElement){
 if(!document.startViewTransition||matchMedia("(prefers-reduced-motion: reduce)").matches){commit();return;}
 active?.skipTransition();const box=trigger.getBoundingClientRect(),x=box.left+box.width/2,y=box.top+box.height/2;
 const radius=Math.hypot(Math.max(x,innerWidth-x),Math.max(y,innerHeight-y));
 document.documentElement.dataset.motion="theme";
 const transition=document.startViewTransition(()=>flushSync(commit));active=transition;
 void transition.ready.then(()=>document.documentElement.animate({clipPath:[`circle(0px at ${x}px ${y}px)`,`circle(${radius}px at ${x}px ${y}px)`]},{duration:650,easing:"cubic-bezier(.22,1,.36,1)",pseudoElement:"::view-transition-new(root)"})).catch(()=>{});
 void transition.finished.catch(()=>{}).finally(()=>{if(active===transition){active=null;delete document.documentElement.dataset.motion;}});
}
