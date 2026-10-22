import React,{useState} from "react";
import {StyleSheet,Text,View} from "react-native";
import {FeedbackPressable as Pressable} from "./feedback-pressable";
import {usePalette} from "./theme";
import {RentalCenter as RentalCenterCore} from "./rental-center";
import {RentalNegotiation} from "./rental-negotiation";

export function RentalCenter({owner,initialConversation="",onMessages}:{owner:boolean;initialConversation?:string;onMessages?:(conversationId:string)=>void}){
 const c=usePalette();const [mode,setMode]=useState<"rental"|"offers">("rental");
 return <View style={{flex:1}}><View style={[s.switcher,{backgroundColor:c.white,borderColor:c.border}]}><Pressable onPress={()=>setMode("rental")} style={[s.tab,mode==="rental"&&{backgroundColor:c.soft}]}><Text style={{color:c.green,fontWeight:"900",fontSize:12}}>Rental</Text></Pressable><Pressable onPress={()=>setMode("offers")} style={[s.tab,mode==="offers"&&{backgroundColor:c.soft}]}><Text style={{color:c.green,fontWeight:"900",fontSize:12}}>Offers</Text></Pressable></View>{mode==="offers"?<RentalNegotiation owner={owner} initialConversation={initialConversation}/>:<RentalCenterCore owner={owner} initialConversation={initialConversation} onMessages={onMessages}/>}</View>;
}
const s=StyleSheet.create({switcher:{marginHorizontal:18,marginTop:12,marginBottom:4,borderWidth:1,borderRadius:16,padding:4,flexDirection:"row",gap:4},tab:{flex:1,minHeight:40,borderRadius:12,alignItems:"center",justifyContent:"center"}});
