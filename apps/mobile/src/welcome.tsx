import React, { useEffect, useState } from "react";
import { Image, Pressable, ScrollView, StyleSheet, Text, View, BackHandler, StatusBar } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors } from "./design";
import { AccountForm } from "./account-form";
import type { Account } from "./session";

const details = [
  {symbol:"⌂", title:"Find your place.\nStart your next chapter.", copy:"HomeTayo brings rental homes, apartments, boarding houses and bedspaces together in one place."},
  {symbol:"⌕", title:"Less searching.\nMore finding.", copy:"Choose a location and property type, review clear rental details, and contact property owners. Verify the property before making payments."},
  {symbol:"▤", title:"Your space.\nSomeone’s new home.", copy:"Property owners can submit a rental for review and manage its availability through HomeTayo."},
];

export function NativeWelcome({returning,onGuest,onSignedIn}: {returning:boolean; onGuest:()=>void;onSignedIn:(account:Account)=>void}) {
  const [step,setStep] = useState(returning ? 3 : 0);
  const [mode,setMode] = useState<"sign-in"|"sign-up"|null>(null);
  const [audience,setAudience] = useState<"renter"|"owner">("renter");

  useEffect(() => {
    const subscription = BackHandler.addEventListener("hardwareBackPress", () => {
      if (mode) { setMode(null);  return true; }
      if (step > 0) { setStep(step-1); return true; }
      return false;
    });
    return () => subscription.remove();
  }, [mode, step]);
  return <SafeAreaView style={s.screen}>
    <StatusBar barStyle="light-content" backgroundColor={colors.green}/>
    <ScrollView contentContainerStyle={s.content}>
      <View style={s.header}><Image source={require("../assets/icon.png")} style={s.logo}/><Text style={s.brand}>Home<Text style={s.gold}>Tayo</Text></Text></View>
      {step < 3 ? <>
        <View style={s.art}><Text style={s.symbol}>{details[step].symbol}</Text></View>
        <Text style={s.kicker}>WELCOME HOME · {step+1} / 3</Text>
        <Text style={s.title}>{details[step].title}</Text><Text style={s.copy}>{details[step].copy}</Text>
        <View style={s.dots}>{details.map((_,i)=><View key={i} style={[s.dot, i===step && s.activeDot]}/>)}</View>
        <Pressable accessibilityRole="button" style={s.primary} onPress={()=>setStep(step+1)}><Text style={s.primaryText}>{step===2 ? "Continue" : "Next"} →</Text></Pressable>
        {step>0 && <Pressable accessibilityRole="button" style={s.link} onPress={()=>setStep(step-1)}><Text style={s.linkText}>← Back</Text></Pressable>}
      </> : mode ? <>
        <Text style={s.kicker}>{mode==="sign-up" ? "CREATE YOUR ACCOUNT" : "WELCOME BACK"}</Text>
        <Text style={s.title}>How will you use HomeTayo?</Text><Text style={s.copy}>Choose your starting experience, then sign in here in the app.</Text>
        {(["renter","owner"] as const).map(value=><Pressable key={value} accessibilityRole="radio" accessibilityState={{checked:audience===value}} onPress={()=>setAudience(value)} style={[s.role, audience===value && s.selectedRole]}><Text style={s.roleTitle}>{value==="renter" ? "⌂  I’m a renter" : "▤  I’m a property owner"}</Text><Text style={s.roleCopy}>{value==="renter" ? "Find a home or room that fits your life." : "Share a rental and manage your listings."}</Text></Pressable>)}
        <AccountForm mode={mode} audience={audience} onComplete={onSignedIn}/>
        <Pressable accessibilityRole="button" style={s.link} onPress={()=>{setMode(null);}}><Text style={s.linkText}>← Back</Text></Pressable>
      </> : <>
        <View style={s.art}><Text style={s.symbol}>⌂</Text></View><Text style={s.kicker}>YOUR NEXT CHAPTER STARTS HERE</Text><Text style={s.title}>A place for everyone.</Text><Text style={s.copy}>Sign in or create an account to choose your renter or property-owner experience.</Text>
        <Pressable accessibilityRole="button" style={s.primary} onPress={()=>setMode("sign-up")}><Text style={s.primaryText}>Create account →</Text></Pressable>
        <Pressable accessibilityRole="button" style={s.secondary} onPress={()=>setMode("sign-in")}><Text style={s.secondaryText}>Sign in</Text></Pressable>
        <Pressable accessibilityRole="button" style={s.link} onPress={()=>setStep(0)}><Text style={s.linkText}>About HomeTayo</Text></Pressable>
      </>}
      {step===3 && <Pressable accessibilityRole="button" style={s.link} onPress={onGuest}><Text style={s.linkText}>Explore rentals as guest →</Text></Pressable>}
    </ScrollView>
  </SafeAreaView>;
}

const s = StyleSheet.create({
  screen:{flex:1,backgroundColor:colors.green},content:{flexGrow:1,padding:26,paddingBottom:36},header:{flexDirection:"row",gap:10,alignItems:"center",marginBottom:34},logo:{width:36,height:36,borderRadius:10},brand:{fontSize:23,fontWeight:"900",color:"white"},gold:{color:colors.gold},
  art:{backgroundColor:"#2b604b",borderRadius:32,height:190,alignItems:"center",justifyContent:"center",marginBottom:28},symbol:{fontSize:100,color:"#e9d6b2"},kicker:{fontSize:10,letterSpacing:1.5,color:colors.gold,fontWeight:"800",marginBottom:14},title:{fontSize:34,lineHeight:41,fontWeight:"900",color:"#fff",letterSpacing:-1},copy:{fontSize:15,lineHeight:25,color:"#d6e6dc",marginTop:18,marginBottom:26},
  dots:{flexDirection:"row",gap:8,marginBottom:26},dot:{height:7,width:7,borderRadius:7,backgroundColor:"#6c947f"},activeDot:{width:28,backgroundColor:colors.gold},primary:{backgroundColor:"#eed6ad",minHeight:54,borderRadius:14,alignItems:"center",justifyContent:"center",padding:14,marginTop:12},primaryText:{color:colors.green,fontWeight:"800",fontSize:15},secondary:{borderWidth:1,borderColor:"#86a393",minHeight:54,borderRadius:14,alignItems:"center",justifyContent:"center",marginTop:12},secondaryText:{color:"white",fontSize:15,fontWeight:"800"},link:{padding:16,alignItems:"center"},linkText:{color:"#dfebe2",fontSize:13,fontWeight:"700"},
  role:{padding:22,borderRadius:18,borderWidth:2,borderColor:"#567c67",marginBottom:12,backgroundColor:"#244e3d"},selectedRole:{borderColor:colors.gold,backgroundColor:"#315e48"},roleTitle:{fontSize:18,fontWeight:"800",color:"white"},roleCopy:{fontSize:13,lineHeight:21,color:"#d6e6dc",marginTop:9},note:{fontSize:12,lineHeight:20,color:"#d6e6dc",marginVertical:12},
});
