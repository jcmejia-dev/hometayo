import React,{createContext,useContext,useEffect,useState,type ReactNode} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
export const themes=[{id:"forest",name:"Forest",accent:"#173D32",soft:"#E8F0E7",background:"#F8F7F2"},{id:"ocean",name:"Ocean",accent:"#174E70",soft:"#E5EFF5",background:"#F4F7F9"},{id:"plum",name:"Plum",accent:"#633C68",soft:"#F0E7F1",background:"#F9F5F8"}];
const key="hometayo.theme.v1";
const Context=createContext({theme:themes[0],setTheme:async(_id:string)=>{}});
export function ThemeProvider({children}:{children:ReactNode}){const [theme,choose]=useState(themes[0]);useEffect(()=>{let active=true;AsyncStorage.getItem(key).then(id=>{if(active)choose(themes.find(t=>t.id===id)||themes[0]);}).catch(()=>{});return()=>{active=false;};},[]);async function setTheme(id:string){const next=themes.find(t=>t.id===id);if(!next)return;await AsyncStorage.setItem(key,id);choose(next);}return <Context.Provider value={{theme,setTheme}}>{children}</Context.Provider>;}
export const useTheme=()=>useContext(Context);
