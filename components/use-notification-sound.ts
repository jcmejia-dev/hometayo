"use client";
import {useCallback,useEffect,useRef,useState} from "react";
import {unreadArrivals} from "@/lib/notification-arrivals";
export function useNotificationSound(){
 const [enabled,setEnabled]=useState(true);
 const enabledRef=useRef(true),audio=useRef<HTMLAudioElement|null>(null),unlocked=useRef(false),seen=useRef<Set<string>|null>(null);
 useEffect(()=>{
  enabledRef.current=localStorage.getItem("hometayo.notificationSound")!=="off";
  const timer=setTimeout(()=>setEnabled(enabledRef.current),0);
  const sound=new Audio("/sounds/notification.mp3");sound.preload="auto";sound.volume=.45;audio.current=sound;
  const unlock=()=>{if(unlocked.current)return;unlocked.current=true;sound.muted=true;void sound.play().then(()=>{sound.pause();sound.currentTime=0;sound.muted=false;}).catch(()=>{unlocked.current=false;sound.muted=false;});};
  document.addEventListener("pointerdown",unlock);document.addEventListener("keydown",unlock);
  return()=>{clearTimeout(timer);sound.pause();audio.current=null;document.removeEventListener("pointerdown",unlock);document.removeEventListener("keydown",unlock);};
 },[]);
 const onNotifications=useCallback((notices:Array<{id:string;readAt:string|null}>)=>{
  const result=unreadArrivals(seen.current,notices);seen.current=result.next;
  if(result.hasNew&&enabledRef.current&&unlocked.current&&document.visibilityState==="visible"&&audio.current){audio.current.currentTime=0;void audio.current.play().catch(()=>{});}
 },[]);
 return {enabled,onNotifications,toggle:()=>{const value=!enabledRef.current;enabledRef.current=value;setEnabled(value);localStorage.setItem("hometayo.notificationSound",value?"on":"off");}};
}
