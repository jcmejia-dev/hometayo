import React,{useState} from "react";
import { Pressable, Text, TextInput, View, StyleSheet, ActivityIndicator } from "react-native";
import { accountAction, type Account } from "./session";
import { colors } from "./design";
import {isExpoGo} from "./runtime";

export function AccountForm({mode,audience,onComplete}: {mode:"sign-in"|"sign-up";audience:"renter"|"owner";onComplete:(account:Account)=>void}) {
  const [name,setName]=useState(""),[email,setEmail]=useState(""),[password,setPassword]=useState(""),[confirm,setConfirm]=useState("");
  const [verify,setVerify]=useState(false),[code,setCode]=useState(""),[message,setMessage]=useState(""),[busy,setBusy]=useState(false),[registered,setRegistered]=useState(false);
  async function run(google=false) {
    setBusy(true);setMessage("");
    try {
      let result;
      if(google) {
        if(isExpoGo)throw Error("Google sign-in needs the installed HomeTayo app. You can preview the screens and use configured email sign-in in Expo Go.");
        const {GoogleSignin,isSuccessResponse}=require("@react-native-google-signin/google-signin") as typeof import("@react-native-google-signin/google-signin");
        GoogleSignin.configure({webClientId:process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID});
        await GoogleSignin.hasPlayServices();
        const response=await GoogleSignin.signIn();
        if(!isSuccessResponse(response) || !response.data.idToken)throw Error("Google sign-in was cancelled.");
        result=await accountAction({action:"google",idToken:response.data.idToken});
      } else if(verify) {
        result=await accountAction({action:"verify",email:email.trim().toLowerCase(),code});
        setVerify(false);setRegistered(true);setMessage(result.message || "Verified. Sign in now.");return;
      } else if(mode==="sign-up" && !registered) {
        result=await accountAction({action:"signup",name,email:email.trim().toLowerCase(),password,confirmPassword:confirm});
        setVerify(true);setMessage(result.message||"Check your email for a code.");return;
      } else result=await accountAction({action:"login",email:email.trim().toLowerCase(),password});
      if(result.account) {
        const selected=await accountAction({action:"audience",audience});
        onComplete(selected.account || result.account);
      }
    } catch(error){setMessage(error instanceof Error?error.message:"Sign-in failed. Please try again.");}
    finally{setBusy(false);}
  }
  return <View style={s.card}>
    <Text style={s.title}>{verify?"Verify your email":registered||mode==="sign-in"?"Sign in":"Create account"}</Text>
    {verify?<><Text style={s.note}>Enter the six-digit code sent to {email}. It expires in 10 minutes.</Text><TextInput accessibilityLabel="Verification code" value={code} onChangeText={setCode} keyboardType="number-pad" maxLength={6} style={s.input}/></>:<>
      {mode==="sign-up"&&!registered && <><Text style={s.label}>Full name</Text><TextInput accessibilityLabel="Full name" value={name} onChangeText={setName} autoComplete="name" style={s.input}/></>}
      <Text style={s.label}>Email address</Text><TextInput accessibilityLabel="Email address" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" autoComplete="email" style={s.input}/>
      <Text style={s.label}>Password</Text><TextInput accessibilityLabel="Password" value={password} onChangeText={setPassword} secureTextEntry autoComplete={mode==="sign-up"?"new-password":"current-password"} style={s.input}/>
      {mode==="sign-up"&&!registered && <><Text style={s.label}>Confirm password</Text><TextInput accessibilityLabel="Confirm password" value={confirm} onChangeText={setConfirm} secureTextEntry style={s.input}/><Text style={s.note}>Use at least 12 characters.</Text></>}
    </>}
    {message?<Text accessibilityRole="alert" style={s.note}>{message}</Text>:null}
    <Pressable accessibilityRole="button" disabled={busy} onPress={()=>void run()} style={[s.button,busy&&{opacity:.5}]}>{busy?<ActivityIndicator color="white"/>:<Text style={s.buttonText}>{verify?"Verify email":mode==="sign-up"&&!registered?"Create account":"Sign in"}</Text>}</Pressable>
    {!verify&&!isExpoGo&&process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID && <Pressable accessibilityRole="button" disabled={busy} onPress={()=>void run(true)} style={s.google}><Text style={s.googleText}>Continue with Google</Text></Pressable>}
    {isExpoGo&&<Text style={s.note}>Expo Go preview: Google sign-in is available in the installed app. Email sign-in uses the configured HomeTayo backend.</Text>}
    {verify&&<Pressable accessibilityRole="button" onPress={()=>setVerify(false)}><Text style={s.note}>Back / request another code</Text></Pressable>}
  </View>;
}
const s=StyleSheet.create({card:{backgroundColor:"white",borderRadius:22,padding:22,gap:10,marginTop:16},title:{fontSize:24,fontWeight:"800",color:colors.green,marginBottom:8},label:{color:colors.green,fontSize:12,fontWeight:"700"},input:{backgroundColor:"#f4f7f3",borderWidth:1,borderColor:colors.border,borderRadius:10,padding:12,color:colors.ink},note:{fontSize:12,lineHeight:20,color:colors.muted},button:{backgroundColor:colors.green,borderRadius:11,minHeight:48,alignItems:"center",justifyContent:"center",marginTop:8},buttonText:{color:"white",fontWeight:"800"},google:{borderWidth:1,borderColor:colors.border,borderRadius:11,padding:15,alignItems:"center"},googleText:{color:colors.green,fontWeight:"800"}});
