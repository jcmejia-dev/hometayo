import React,{useState} from "react";
import {Alert,Pressable,Text,View} from "react-native";
import {isExpoGo} from "./runtime";
import {colors} from "./design";
export function UpdateButton() {
  const [busy,setBusy]=useState(false),[message,setMessage]=useState("");
  async function check() {
    if(isExpoGo){setMessage("Expo Go loads your local changes through the QR server. Test the Update app feature later in the installed HomeTayo app.");return;}
    const Updates=require("expo-updates") as typeof import("expo-updates");
    if(!Updates.isEnabled){setMessage("Updates will be available in the signed app once EAS Update is configured.");return;}
    setBusy(true);setMessage("");
    try {
      const update=await Updates.checkForUpdateAsync();
      if(!update.isAvailable){setMessage("You’re using the latest compatible update.");return;}
      await Updates.fetchUpdateAsync();
      Alert.alert("Update ready","Restart HomeTayo to apply this update?",[{text:"Later",style:"cancel"},{text:"Restart now",onPress:()=>{void Updates.reloadAsync().catch(()=>setMessage("Please close and reopen HomeTayo to apply the update."));}}]);
    } catch {setMessage("Couldn’t check for updates. Check your connection and try again.");}
    finally {setBusy(false);}
  }
  return <View style={{marginTop:22}}><Pressable accessibilityRole="button" disabled={busy} onPress={()=>void check()} style={{padding:16,backgroundColor:colors.green,borderRadius:12}}><Text style={{color:"white",fontWeight:"800",textAlign:"center"}}>{busy?"Checking updates…":"Update app"}</Text></Pressable>{message?<Text accessibilityRole="alert" style={{color:colors.muted,lineHeight:20,marginTop:12}}>{message}</Text>:null}</View>;
}
