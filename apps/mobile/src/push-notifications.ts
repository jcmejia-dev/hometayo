import {Platform} from "react-native";
import Constants from "expo-constants";
import * as Notifications from "expo-notifications";
import {api} from "./session";
import {openAppUpdate} from "./app-update";

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
    await Promise.all([
      Notifications.setNotificationChannelAsync("messages",{
        name:"Messages",description:"Messages, offers and negotiation updates",importance:Notifications.AndroidImportance.MAX,sound:"default",vibrationPattern:[0,250,160,250],lockscreenVisibility:Notifications.AndroidNotificationVisibility.PUBLIC,enableVibrate:true,showBadge:true,
      }),
      Notifications.setNotificationChannelAsync("rentals",{
        name:"Rental updates",description:"Reservation, rent, tenancy, maintenance and document updates",importance:Notifications.AndroidImportance.MAX,sound:"default",vibrationPattern:[0,250,160,250],lockscreenVisibility:Notifications.AndroidNotificationVisibility.PUBLIC,enableVibrate:true,showBadge:true,
      }),
      Notifications.setNotificationChannelAsync("updates",{
        name:"App updates",description:"New HomeTayo Android versions",importance:Notifications.AndroidImportance.HIGH,sound:"default",vibrationPattern:[0,220,150,220],lockscreenVisibility:Notifications.AndroidNotificationVisibility.PUBLIC,enableVibrate:true,showBadge:true,
      }),
    ]);
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

export function listenForNotificationResponses(openConversation:(conversationId:string)=>void,openRental?:(conversationId?:string)=>void){
  const handle=(response:Notifications.NotificationResponse|null)=>{
    const data=response?.notification.request.content.data;
    if(data?.screen==="update"){
      const url=typeof data.downloadUrl==="string"?data.downloadUrl:undefined;
      void openAppUpdate(url).catch(()=>{});
      return;
    }
    const id=typeof data?.conversationId==="string"&&data.conversationId?data.conversationId:undefined;
    // A conversation-specific rental event belongs in Messages. Check the explicit
    // screen before the generic rental type so offer/payment pushes do not get
    // diverted into the old Rental Center route.
    if(data?.screen==="messages"&&id){openConversation(id);return;}
    if(data?.screen==="rental"){openRental?.(id);return;}
    if(id){openConversation(id);return;}
    if(data?.type==="rental")openRental?.();
  };
  void Notifications.getLastNotificationResponseAsync().then(handle).catch(()=>{});
  const subscription=Notifications.addNotificationResponseReceivedListener(handle);
  return()=>subscription.remove();
}
