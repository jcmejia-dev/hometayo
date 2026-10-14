import * as SecureStore from "expo-secure-store";
export type Account={id:string;email:string;displayName:string|null;role:string};
const KEY="hometayo.native.session";
const base=process.env.EXPO_PUBLIC_API_URL || "https://hometayoph.vercel.app";
const origin=new URL(base);
if(origin.username || origin.password || (origin.protocol!=="https:" && !(origin.protocol==="http:"&&["localhost","127.0.0.1"].includes(origin.hostname))))throw Error("Account API requires HTTPS");
let onExpired:(()=>void)|null=null;
export function watchSessionExpired(callback:()=>void) {onExpired=callback;return()=>{if(onExpired===callback)onExpired=null;};}
export async function api(path:string,body?:unknown,method?:"PATCH") {
  const token=await SecureStore.getItemAsync(KEY);
  const response=await fetch(origin.origin+path,{method:method || (body?"POST":"GET"),headers:{Accept:"application/json",...(body?{"Content-Type":"application/json"}:{}),...(token?{Authorization:"Bearer "+token}:{})},body:body?JSON.stringify(body):undefined});
  const data=await response.json();
  if(response.status===401&&token){await SecureStore.deleteItemAsync(KEY);onExpired?.();}
  if(!response.ok)throw Error(data.message || "HomeTayo is temporarily unavailable.");
  return data;
}
export async function accountAction(body:unknown) {
  const data=await api("/api/mobile/auth",body);
  if(typeof data.token==="string")await SecureStore.setItemAsync(KEY,data.token,{keychainAccessible:SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY});
  return data as {account?:Account;message?:string};
}
export async function restoreAccount():Promise<Account|null> {
  if(!await SecureStore.getItemAsync(KEY))return null;
  return (await api("/api/mobile/auth")).account;
}
export async function logOut() {
  await accountAction({action:"logout"});
  await SecureStore.deleteItemAsync(KEY);
}
