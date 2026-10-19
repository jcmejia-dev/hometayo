import {Platform} from "react-native";
import Constants from "expo-constants";
import * as Notifications from "expo-notifications";
import {api} from "./session";

Notifications.setNotificationHandler({
  handleNotification:async()=>({
    shouldShowBanner:true,
    shouldShowList:true,
    shouldPlaySound:true,
    shouldSetBadge:false,
    priority:Notifications.AndroidNotificationPriority.HIGH,
  }),
});

export async function registerPushNotifications(){
  if(Platform.OS==="android"){
    await Notifications.setNotificationChannelAsync("messages",{
      name:"Messages",
      description:"New HomeTayo rental messages",
      importance:Notifications.AndroidImportance.MAX,
      sound:"default",
      vibrationPattern:[0,250,160,250],
      lockscreenVisibility:Notifications.AndroidNotificationVisibility.PUBLIC,
      enableVibrate:true,
      showBadge:true,
    });
  }
  let permissions=await Notifications.getPermissionsAsync();
  if(permissions.status!=="granted")permissions=await Notifications.requestPermissionsAsync();
  if(permissions.status!=="granted")return false;
  const projectId=(Constants.expoConfig?.extra?.eas as {projectId?:string}|undefined)?.projectId||Constants.easConfig?.projectId;
  if(!projectId)return false;
  const token=(await Notifications.getExpoPushTokenAsync({projectId})).data;
  await api("/api/mobile/push-token",{token,platform:Platform.OS});
  return true;
}

export function listenForNotificationResponses(openConversation:(conversationId:string)=>void){
  const handle=(response:Notifications.NotificationResponse|null)=>{
    const id=response?.notification.request.content.data?.conversationId;
    if(typeof id==="string"&&id)openConversation(id);
  };
  void Notifications.getLastNotificationResponseAsync().then(handle).catch(()=>{});
  const subscription=Notifications.addNotificationResponseReceivedListener(handle);
  return()=>subscription.remove();
}
