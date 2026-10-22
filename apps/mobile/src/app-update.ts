import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";
import * as Notifications from "expo-notifications";
import {Linking,Platform} from "react-native";

const RELEASE_API="https://api.github.com/repos/jcmejia-dev/hometayo/releases/tags/android-latest";
const DOWNLOAD_URL="https://github.com/jcmejia-dev/hometayo/releases/download/android-latest/HomeTayo.apk";
const NOTIFIED_KEY="hometayo.native.update-notified-build";
const CHECK_INTERVAL_MS=15*60*1000;

type GithubRelease={body?:unknown;assets?:Array<{name?:unknown;browser_download_url?:unknown}>};
export type AppUpdateInfo={installedVersionCode:number;latestVersionCode:number;buildNumber:number;downloadUrl:string};
let checkedAt=0;
let cached:AppUpdateInfo|null=null;

function installedVersionCode(){
 const raw=Constants.nativeBuildVersion;
 const parsed=typeof raw==="string"?Number.parseInt(raw,10):Number(raw);
 return Number.isInteger(parsed)&&parsed>0?parsed:null;
}

function releaseInfo(value:GithubRelease,installed:number):AppUpdateInfo|null{
 const notes=typeof value.body==="string"?value.body:"";
 const match=notes.match(/\bBuild\s+(\d+)\b/i);
 if(!match)return null;
 const buildNumber=Number.parseInt(match[1],10);
 if(!Number.isInteger(buildNumber)||buildNumber<1)return null;
 const latestVersionCode=1000+buildNumber;
 if(latestVersionCode<=installed)return null;
 const asset=value.assets?.find(x=>x.name==="HomeTayo.apk");
 const downloadUrl=typeof asset?.browser_download_url==="string"&&asset.browser_download_url.startsWith("https://github.com/")?asset.browser_download_url:DOWNLOAD_URL;
 return {installedVersionCode:installed,latestVersionCode,buildNumber,downloadUrl};
}

export async function checkForAppUpdate(force=false):Promise<AppUpdateInfo|null>{
 if(__DEV__)return null;
 const installed=installedVersionCode();
 if(!installed)return null;
 const now=Date.now();
 if(!force&&now-checkedAt<CHECK_INTERVAL_MS)return cached;
 checkedAt=now;
 const controller=new AbortController();
 const timeout=setTimeout(()=>controller.abort(),8000);
 try{
  const response=await fetch(RELEASE_API,{signal:controller.signal,headers:{Accept:"application/vnd.github+json","X-GitHub-Api-Version":"2022-11-28"}});
  if(!response.ok)return cached;
  const value=await response.json() as GithubRelease;
  cached=releaseInfo(value,installed);
  return cached;
 }catch{return cached;}
 finally{clearTimeout(timeout);}
}

export async function notifyForAppUpdate(update:AppUpdateInfo){
 const already=await AsyncStorage.getItem(NOTIFIED_KEY).catch(()=>null);
 if(already===String(update.latestVersionCode))return;
 const permission=await Notifications.getPermissionsAsync().catch(()=>null);
 if(permission?.status!=="granted")return;
 if(Platform.OS==="android")await Notifications.setNotificationChannelAsync("updates",{
  name:"App updates",description:"New HomeTayo Android versions",importance:Notifications.AndroidImportance.HIGH,sound:"default",vibrationPattern:[0,220,150,220],showBadge:true,
 }).catch(()=>{});
 await Notifications.scheduleNotificationAsync({
  content:{title:"New HomeTayo update available",body:"A newer HomeTayo app is ready. Tap to download the latest APK.",sound:"default",data:{screen:"update",downloadUrl:update.downloadUrl,latestVersionCode:update.latestVersionCode}},
  trigger:null,
 });
 await AsyncStorage.setItem(NOTIFIED_KEY,String(update.latestVersionCode)).catch(()=>{});
}

export async function openAppUpdate(downloadUrl?:string){
 const target=downloadUrl||DOWNLOAD_URL;
 if(!target.startsWith("https://github.com/jcmejia-dev/hometayo/"))return false;
 return Linking.openURL(target).then(()=>true).catch(()=>false);
}
