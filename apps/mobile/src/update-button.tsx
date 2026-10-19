import {FeedbackPressable as Pressable} from "./feedback-pressable";
import {usePalette} from "./theme";
import React,{useEffect,useRef,useState} from "react";
import {Alert,AppState,Text,View} from "react-native";
import {isExpoGo} from "./runtime";
import {Icon} from "./icons";
import {colors as brandColors} from "./design";

export function UpdateButton() {
  const colors=usePalette();
  const [busy,setBusy]=useState(false),[message,setMessage]=useState(""),[available,setAvailable]=useState(false);
  const lastAutoCheck=useRef(0),mounted=useRef(true);

  useEffect(()=>{
    mounted.current=true;
    async function autoCheck(){
      if(isExpoGo||Date.now()-lastAutoCheck.current<60000)return;
      lastAutoCheck.current=Date.now();
      try{
        const Updates=require("expo-updates") as typeof import("expo-updates");
        if(!Updates.isEnabled)return;
        const update=await Updates.checkForUpdateAsync();
        if(mounted.current)setAvailable(update.isAvailable);
      }catch{/* Silent background check; manual check still reports errors. */}
    }
    void autoCheck();
    const sub=AppState.addEventListener("change",state=>{if(state==="active")void autoCheck();});
    return()=>{mounted.current=false;sub.remove();};
  },[]);

  async function check() {
    if(isExpoGo){setMessage("Expo Go loads your local changes through the QR server. Test the Update app feature later in the installed HomeTayo app.");return;}
    const Updates=require("expo-updates") as typeof import("expo-updates");
    if(!Updates.isEnabled){setMessage("Updates will be available in the signed app once EAS Update is configured.");return;}
    setBusy(true);setMessage("");
    try {
      const update=await Updates.checkForUpdateAsync();
      setAvailable(update.isAvailable);
      if(!update.isAvailable){setMessage("You’re using the latest compatible update.");return;}
      await Updates.fetchUpdateAsync();
      setAvailable(false);
      Alert.alert("Update ready","Restart HomeTayo to apply this update?",[{text:"Later",style:"cancel"},{text:"Restart now",onPress:()=>{void Updates.reloadAsync().catch(()=>setMessage("Please close and reopen HomeTayo to apply the update."));}}]);
    } catch {setMessage("Couldn’t check for updates. Check your connection and try again.");}
    finally {setBusy(false);}
  }

  return <View style={{marginTop:22}}>
    <Pressable accessibilityRole="button" disabled={busy} onPress={()=>void check()} style={{padding:16,backgroundColor:colors.white,borderWidth:1,borderColor:available?brandColors.gold:colors.border,borderRadius:16,flexDirection:"row",gap:10,alignItems:"center",justifyContent:"center"}}>
      <Icon name="refresh" size={19}/>
      <Text style={{color:colors.green,fontWeight:"800",textAlign:"center"}}>{busy?"Checking updates…":"Update app"}</Text>
      {available?<View accessibilityLabel="1 update available" style={{minWidth:21,height:21,borderRadius:11,paddingHorizontal:6,backgroundColor:brandColors.gold,alignItems:"center",justifyContent:"center"}}><Text style={{color:colors.green,fontSize:11,fontWeight:"900"}}>1</Text></View>:null}
    </Pressable>
    {available?<Text style={{color:colors.green,fontSize:12,fontWeight:"700",textAlign:"center",marginTop:8}}>New update available — tap Update app.</Text>:null}
    {message?<Text accessibilityRole="alert" style={{color:colors.muted,lineHeight:20,marginTop:12}}>{message}</Text>:null}
  </View>;
}
