import {File,UploadType} from "expo-file-system";
import * as SecureStore from "expo-secure-store";
export type Account={id:string;email:string;displayName:string|null;role:string};
const KEY="hometayo.native.session";
const base=process.env.EXPO_PUBLIC_API_URL || "https://hometayoph.vercel.app";
const origin=new URL(base);
if(origin.username || origin.password || (origin.protocol!=="https:" && !(origin.protocol==="http:"&&["localhost","127.0.0.1"].includes(origin.hostname))))throw Error("Account API requires HTTPS");
let onExpired:(()=>void)|null=null;
export function watchSessionExpired(callback:()=>void) {onExpired=callback;return()=>{if(onExpired===callback)onExpired=null;};}
async function token(){return SecureStore.getItemAsync(KEY);}
export async function api(path:string,body?:unknown,method?:"PATCH") {
  const saved=await token();
  const controller=new AbortController();
  const timeout=setTimeout(()=>controller.abort(),20000);
  try{
    const response=await fetch(origin.origin+path,{signal:controller.signal,method:method || (body?"POST":"GET"),headers:{Accept:"application/json",...(body?{"Content-Type":"application/json"}:{}),...(saved?{Authorization:"Bearer "+saved}:{})},body:body?JSON.stringify(body):undefined});
    const data=await response.json().catch(()=>null);
    if(response.status===401&&saved){await SecureStore.deleteItemAsync(KEY);onExpired?.();}
    if(!response.ok){
      if(response.status===503&&typeof data?.message==="string"&&data.message.includes("awaiting setup"))throw Error("Account service setup is pending. You can explore rentals as a guest until sign-in is enabled.");
      throw Error(data?.message || "HomeTayo is temporarily unavailable. Please try again.");
    }
    if(!data||typeof data!=="object")throw Error("HomeTayo returned an incomplete response. Please try again.");
    return data;
  }catch(error){
    if(controller.signal.aborted)throw Error("The connection timed out. Check your internet and try again.");
    if(error instanceof TypeError)throw Error("Could not connect to HomeTayo. Check your internet and try again.");
    throw error;
  }finally{clearTimeout(timeout);}
}
async function uploadFile(path:string,uri:string,mime:string,_name:string){
  const saved=await token();if(!saved)throw Error("Please sign in.");
  const file=new File(uri);
  let result:{body:string;status:number;headers:Record<string,string>};
  try{
    result=await file.upload(origin.origin+path,{
      httpMethod:"POST",
      uploadType:UploadType.MULTIPART,
      fieldName:"file",
      mimeType:mime||file.type||"application/octet-stream",
      headers:{Accept:"application/json",Authorization:"Bearer "+saved},
    });
  }catch(error){
    throw Error(error instanceof Error&&error.message?`File upload failed: ${error.message}`:"File upload failed. Choose the file again and retry.");
  }
  let data:any=null;try{data=JSON.parse(result.body);}catch{/* server may return an empty/non-JSON error body */}
  if(result.status===401){await SecureStore.deleteItemAsync(KEY);onExpired?.();}
  if(result.status<200||result.status>=300)throw Error(data?.message||"File upload failed.");
  if(!data||typeof data.url!=="string")throw Error("Upload completed but HomeTayo returned an invalid file response.");
  return data as {url:string};
}
export async function uploadPhoto(uri:string,mime:string,name:string){return uploadFile("/api/mobile/owner-photo-upload",uri,mime,name);}
export async function uploadRentalFile(uri:string,mime:string,name:string){return uploadFile("/api/mobile/rental-file-upload",uri,mime,name);}
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
