import {usePalette,useThemedStyles} from "./theme";
import React,{useEffect,useState} from "react";
import {Pressable,Text,TextInput,Image,View,StyleSheet,ActivityIndicator,type TextInputProps} from "react-native";
import {accountAction,api,type Account} from "./session";
import {colors} from "./design";
import {isExpoGo} from "./runtime";
import {Icon,type IconName} from "./icons";
import {accountValidation} from "./account-validation";

function Field({label,icon,password=false,...props}:TextInputProps&{label:string;icon:IconName;password?:boolean}){
  const colors=usePalette(); const s=useThemedStyles(baseStyles);

  const [visible,setVisible]=useState(false),[focused,setFocused]=useState(false);
  return <View style={s.field}><Text style={s.label}>{label}</Text><View style={[s.inputWrap,focused&&s.focused]}><Icon name={icon} size={19} color={colors.sage}/><TextInput {...props} accessibilityLabel={label} secureTextEntry={password&&!visible} autoCapitalize={password?"none":props.autoCapitalize} autoCorrect={password?false:props.autoCorrect} onFocus={()=>setFocused(true)} onBlur={()=>setFocused(false)} placeholderTextColor={colors.muted} style={s.input}/>{password&&<Pressable accessibilityRole="button" accessibilityLabel={(visible?"Hide ":"Show ")+label.toLowerCase()} accessibilityState={{checked:visible}} onPress={()=>setVisible(!visible)} hitSlop={8} style={s.eye}><Icon name={visible?"eye-off":"eye"} size={20}/></Pressable>}</View></View>;
}
export function AccountForm({mode,audience,onComplete,onSwitch,onStageChange}: {mode:"sign-in"|"sign-up";audience:"renter"|"owner";onComplete:(account:Account)=>void;onSwitch:()=>void;onStageChange:(choosing:boolean)=>void}){
  const s=useThemedStyles(baseStyles);

  const [name,setName]=useState(""),[email,setEmail]=useState(""),[password,setPassword]=useState(""),[confirm,setConfirm]=useState("");
  const [verify,setVerify]=useState(false),[code,setCode]=useState(""),[message,setMessage]=useState(""),[busy,setBusy]=useState(false),[registered,setRegistered]=useState(false);
  const [availability,setAvailability]=useState<{emailSignIn:boolean;emailSignUp:boolean;google:boolean}|null>(null);
  useEffect(()=>{onStageChange(mode==="sign-up"&&!verify&&!registered&&!busy);},[mode,verify,registered,busy,onStageChange]);
  const signup=mode==="sign-up"&&!registered;
  useEffect(()=>{let active=true;api("/api/mobile/auth/status").then(data=>{if(active&&typeof data.emailSignIn==="boolean"&&typeof data.emailSignUp==="boolean"&&typeof data.google==="boolean")setAvailability(data);}).catch(()=>{});return()=>{active=false;};},[]);
  async function run(google=false){
    if(busy)return;
    if(!google){const error=accountValidation(verify?"verify":signup?"sign-up":"sign-in",{name,email,password,confirm,code});if(error){setMessage(error);return;}}
    if(google&&isExpoGo){setMessage("Google's account picker needs the installed HomeTayo app or a development build. Expo Go can preview this screen; it cannot run native Google sign-in.");return;}
    if(google&&!process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID){setMessage("Google sign-in is awaiting app configuration.");return;}
    if(availability&&!(google?availability.google:signup?availability.emailSignUp:availability.emailSignIn)){setMessage("Account service setup is still pending. Your details have not been sent. You can explore rentals as a guest.");return;}
    setBusy(true);setMessage("");
    try{
      let result;
      if(google){
        const {GoogleSignin,isSuccessResponse}=require("@react-native-google-signin/google-signin") as typeof import("@react-native-google-signin/google-signin");
        GoogleSignin.configure({webClientId:process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID});
        await GoogleSignin.hasPlayServices();const response=await GoogleSignin.signIn();
        if(!isSuccessResponse(response)||!response.data.idToken)throw Error("Google sign-in was cancelled.");
        result=await accountAction({action:"google",idToken:response.data.idToken,...(signup?{audience}:{})});
      }else if(verify){
        result=await accountAction({action:"verify",email:email.trim().toLowerCase(),code});
        setVerify(false);setRegistered(true);setCode("");setMessage(result.message||"Email verified. Sign in to continue.");return;
      }else if(signup){
        result=await accountAction({action:"signup",name:name.trim(),email:email.trim().toLowerCase(),password,confirmPassword:confirm,audience});
        setVerify(true);setMessage(result.message||"Check your email for a code.");return;
      }else result=await accountAction({action:"login",email:email.trim().toLowerCase(),password});
      if(!result.account)throw Error("Sign-in did not return an account. Please try again.");
      onComplete(result.account);
    }catch(error){setMessage(error instanceof Error?error.message:"Sign-in failed. Please try again.");}finally{setBusy(false);}
  }
  return <View style={s.card}>
    <View style={s.badge}><Icon name={verify?"mail":"lock"} size={22}/></View>
    <Text style={s.title}>{verify?"Check your inbox":signup?"Make yourself at home":"Welcome back"}</Text>
    <Text style={s.note}>{verify?"Enter the six-digit code sent to "+email+". It expires in 10 minutes.":signup?"Create your HomeTayo account to get started.":"Sign in to your HomeTayo account."}</Text>
    {verify&&<Text style={s.label}>{audience==="owner"?"Property owner account":"Renter account"}</Text>}
    {verify?<Field label="Verification code" icon="key" value={code} onChangeText={setCode} keyboardType="number-pad" maxLength={6} placeholder="000000" autoComplete="one-time-code"/>:<>
      {signup&&<Field label="Full name" icon="user" value={name} onChangeText={setName} autoComplete="name" placeholder="Your full name" maxLength={80}/>}
      <Field label="Email address" icon="mail" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" autoComplete="email" placeholder="you@example.com" maxLength={254}/>
      <Field label="Password" icon="lock" password value={password} onChangeText={setPassword} autoComplete={signup?"new-password":"current-password"} placeholder={signup?"At least 12 characters":"Your password"} maxLength={128}/>
      {signup&&<Field label="Confirm password" icon="lock" password value={confirm} onChangeText={setConfirm} autoComplete="new-password" placeholder="Repeat your password" maxLength={128}/>}
    </>}
    {message?<View style={s.notice}><Text accessibilityRole="alert" style={s.note}>{message}</Text></View>:null}
    <Pressable accessibilityRole="button" disabled={busy} onPress={()=>void run()} style={[s.button,busy&&{opacity:.6}]}>{busy?<ActivityIndicator color="white"/>:<><Text style={s.buttonText}>{verify?"Verify email":signup?"Create account":"Sign in"}</Text><Icon name="arrow" color="white" size={18}/></>}</Pressable>
    {!verify&&<><View style={s.divider}><View style={s.line}/><Text style={s.note}>or continue with</Text><View style={s.line}/></View><Pressable accessibilityRole="button" disabled={busy} onPress={()=>void run(true)} style={s.google}><Image source={require("../assets/google-g.png")} style={{width:20,height:20}} accessible={false}/><Text style={s.googleText}>Continue with Google</Text></Pressable>{isExpoGo&&<Text style={s.preview}>Google sign-in requires the installed app. Email sign-in works here once the account service is configured.</Text>}{!registered&&<Pressable accessibilityRole="button" disabled={busy} onPress={onSwitch} style={s.switch}><Text style={s.note}>{signup?"Already have an account?":"New to HomeTayo?"} <Text style={s.googleText}>{signup?"Sign in":"Create account"}</Text></Text></Pressable>}</>}
    {verify&&<Pressable accessibilityRole="button" disabled={busy} onPress={()=>{setVerify(false);setMessage("Check your email address, then submit again to request a new code.");}} style={s.switch}><Text style={s.googleText}>Change email / request a new code</Text></Pressable>}
  </View>;
}
const baseStyles=StyleSheet.create({card:{backgroundColor:colors.white,borderRadius:26,padding:22,gap:14,marginTop:16,borderWidth:1,borderColor:colors.border},badge:{width:48,height:48,borderRadius:16,backgroundColor:colors.soft,alignItems:"center",justifyContent:"center"},title:{fontSize:25,fontWeight:"800",color:colors.green,letterSpacing:-.7},field:{gap:8},label:{color:colors.green,fontSize:12,fontWeight:"700"},inputWrap:{flexDirection:"row",alignItems:"center",backgroundColor:colors.field,borderWidth:1,borderColor:colors.border,borderRadius:14,paddingLeft:14,minHeight:54},focused:{borderColor:colors.green2},input:{flex:1,padding:13,color:colors.ink,fontSize:14},eye:{minHeight:48,minWidth:48,alignItems:"center",justifyContent:"center"},note:{fontSize:12,lineHeight:20,color:colors.muted},notice:{padding:13,borderRadius:12,backgroundColor:colors.soft},button:{backgroundColor:colors.green,borderRadius:14,minHeight:52,alignItems:"center",justifyContent:"center",flexDirection:"row",gap:10,marginTop:4},buttonText:{color:"white",fontWeight:"800",fontSize:14},divider:{flexDirection:"row",alignItems:"center",gap:12},line:{flex:1,height:1,backgroundColor:colors.border},google:{borderWidth:1,borderColor:colors.border,borderRadius:14,minHeight:52,flexDirection:"row",gap:12,justifyContent:"center",alignItems:"center"},googleText:{color:colors.green,fontWeight:"800"},preview:{fontSize:11,lineHeight:18,color:colors.muted},switch:{alignItems:"center",paddingVertical:8}});
