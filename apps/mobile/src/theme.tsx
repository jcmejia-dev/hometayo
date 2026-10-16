import React,{createContext,useContext,useEffect,useMemo,useRef,useState,type ReactNode} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {useReducedMotion} from "./motion";
import {themes,paletteAt,themedStyles,type Palette} from "./theme-palette";
export {themes} from "./theme-palette";
const key="hometayo.theme.v1";
const Context=createContext({theme:themes[0],setTheme:async(_id:string)=>{},reducedMotion:true});
export function ThemeProvider({children}:{children:ReactNode}){
 const [theme,choose]=useState(themes[0]),current=useRef(theme),frame=useRef<number|null>(null),reduced=useReducedMotion(),revision=useRef(0),mounted=useRef(true),motion=useRef(reduced);
 motion.current=reduced;
 useEffect(()=>{mounted.current=true;let active=true;const version=revision.current;AsyncStorage.getItem(key).then(id=>{if(active&&revision.current===version){const saved=themes.find(t=>t.id===id)||themes[0];current.current=saved;choose(saved);}}).catch(()=>{});return()=>{active=false;mounted.current=false;if(frame.current!==null)cancelAnimationFrame(frame.current);};},[]);
 async function setTheme(id:string){const next=themes.find(t=>t.id===id);if(!next)return;const version=++revision.current;await AsyncStorage.setItem(key,id);if(!mounted.current||version!==revision.current)return;if(frame.current!==null)cancelAnimationFrame(frame.current);const from=current.current.palette,start=Date.now();const tick=()=>{const t=motion.current?1:Math.min(1,(Date.now()-start)/260),palette=paletteAt(from,next.palette,t*t*(3-2*t));const display={...next,palette,accent:palette.green,soft:palette.soft,background:palette.cream};current.current=display;choose(display);if(t<1)frame.current=requestAnimationFrame(tick);else frame.current=null;};tick();}
 return <Context.Provider value={{theme,setTheme,reducedMotion:reduced}}>{children}</Context.Provider>;
}
export const useTheme=()=>useContext(Context);
export function usePalette():Palette{return useTheme().theme.palette;}
export function useThemedStyles<T>(styles:T):T{const palette=usePalette();return useMemo(()=>themedStyles(styles,palette),[styles,palette]);}
