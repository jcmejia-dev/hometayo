import React from "react";
import {Text,View} from "react-native";
import {Icon} from "./icons";

export function VerifiedBadge({compact=false}:{compact?:boolean}){
 return <View accessibilityLabel="Verified owner" style={{flexDirection:"row",alignItems:"center",gap:4,backgroundColor:"#EAF3FF",borderRadius:999,paddingHorizontal:compact?5:7,paddingVertical:compact?2:3}}>
  <View style={{width:compact?15:17,height:compact?15:17,borderRadius:999,alignItems:"center",justifyContent:"center",backgroundColor:"#2F80ED"}}><Icon name="check" size={compact?10:11} color="white"/></View>
  {!compact&&<Text style={{color:"#2369BE",fontSize:10,fontWeight:"900"}}>Verified</Text>}
 </View>;
}
