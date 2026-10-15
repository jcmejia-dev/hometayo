import React,{useEffect,useRef,useState} from "react";
import {Animated,Image,Pressable,ScrollView,StyleSheet,Text,View,BackHandler,StatusBar,KeyboardAvoidingView,Platform} from "react-native";
import {SafeAreaView} from "react-native-safe-area-context";
import {colors} from "./design";
import {AccountForm} from "./account-form";
import {Icon,type IconName} from "./icons";
import {useReducedMotion,useSceneTransition,useIllustrationMotion} from "./motion";
import {OnboardingArt} from "./onboarding-art";
import type {Account} from "./session";
const details:Array<{icon:IconName;title:string;copy:string;tag:string}>= [
  {icon:"home",title:"Your next chapter\nstarts at home.",copy:"Discover houses, apartments, boarding houses and bedspaces. Find a space that fits your life, all in one place.",tag:"A space for every story"},
  {icon:"pin",title:"Closer to where\nyou want to be.",copy:"Explore rentals on the map. Compare prices, details and distances to the places that matter to you.",tag:"Explore your neighbourhood"},
  {icon:"key",title:"Open the door\nto new possibilities.",copy:"Own a rental? Share your property for review and manage your listings. Renters can browse freely and check details before contacting owners.",tag:"For renters & property owners"},
];
function WelcomeArt({icon,tag,reduced}:{icon:IconName;tag:string;secondary:IconName;reduced:boolean}){
  return <OnboardingArt variant={icon==="pin"?"map":icon==="key"?"keys":"home"} tag={tag} reduced={reduced}/>;
}
function AuthIntro({reduced}:{reduced:boolean}){
  const motion=useIllustrationMotion(reduced);
  return <View style={s.authGreeting}><View style={{flex:1}}><Text style={s.authTitle}>A place for you.</Text><Text style={s.authCopy}>Choose how you’ll use HomeTayo.</Text></View><Animated.View style={[s.authGreetingIcon,motion.hero]}><Icon name="key" size={29}/></Animated.View></View>;
}
function SignedInWelcome({account,onDone,reduced}:{account:Account;onDone:()=>void;reduced:boolean}){
  const progress=useRef(new Animated.Value(0)).current;
  const done=useRef(onDone);done.current=onDone;
  useEffect(()=>{if(reduced){done.current();return;}const sequence=Animated.sequence([Animated.spring(progress,{toValue:1,damping:11,stiffness:170,useNativeDriver:true}),Animated.delay(420)]);sequence.start(({finished})=>{if(finished)done.current();});return()=>sequence.stop();},[reduced,progress]);
  return <View style={s.success} accessibilityLiveRegion="polite"><Animated.View style={{opacity:progress.interpolate({inputRange:[0,1],outputRange:[0,1],extrapolate:"clamp"}),transform:[{scale:progress.interpolate({inputRange:[0,1],outputRange:[.65,1]})}]}}><View style={s.successIcon}><Icon name="home" size={64} color="#EED6AD"/><View style={s.successCheck}><Icon name="check" color="white" size={19}/></View></View></Animated.View><Text style={s.kicker}>YOU’RE IN</Text><Text style={s.title}>Welcome home.</Text><Text style={[s.copy,{textAlign:"center"}]}>{account.role==="landlord"?"Let’s make room for someone’s next chapter.":"Let’s find a place for your next chapter."}</Text></View>;
}
export function NativeWelcome({returning,onGuest,onSignedIn}:{returning:boolean;onGuest:()=>void;onSignedIn:(account:Account)=>void}){
  const [choosingRole,setChoosingRole]=useState(true);
  const [step,setStep]=useState(returning?3:0),[mode,setMode]=useState<"sign-in"|"sign-up"|null>(null),[audience,setAudience]=useState<"renter"|"owner">("renter");
  const reduced=useReducedMotion(),scroll=useRef<ScrollView>(null);
  const [signedIn,setSignedIn]=useState<Account|null>(null);
  const scene=useSceneTransition(String(step)+":"+mode,reduced);
  function navigate(nextStep:number,nextMode:typeof mode,forward=true){scene.change(()=>{scroll.current?.scrollTo({y:0,animated:false});setStep(nextStep);setMode(nextMode);},forward);}
  useEffect(()=>{const sub=BackHandler.addEventListener("hardwareBackPress",()=>{if(signedIn)return true;if(mode){navigate(step,null,false);return true;}if(step>0){navigate(step-1,null,false);return true;}return false;});return()=>sub.remove();},[mode,step,reduced,signedIn]);
  const auth=step===3&&mode!==null;
  if(signedIn)return <SafeAreaView style={s.screen}><StatusBar barStyle="light-content" backgroundColor={colors.green}/><SignedInWelcome account={signedIn} reduced={reduced} onDone={()=>onSignedIn(signedIn)}/></SafeAreaView>;
  return <SafeAreaView style={[s.screen,auth&&s.authScreen]}>
    <StatusBar barStyle={auth?"dark-content":"light-content"} backgroundColor={auth?colors.cream:colors.green}/>
    <KeyboardAvoidingView style={{flex:1}} behavior={Platform.OS==="ios"?"padding":"height"}>
    <ScrollView ref={scroll} keyboardShouldPersistTaps="handled" contentContainerStyle={s.content}>
      <View style={s.header}><View style={s.brandRow}><Image source={require("../assets/icon.png")} style={s.logo}/><Text style={[s.brand,auth&&{color:colors.green}]}>Home<Text style={s.gold}>Tayo</Text></Text></View>{step<3&&<Pressable accessibilityRole="button" onPress={()=>navigate(3,null)} style={s.skip}><Text style={s.skipText}>Skip</Text></Pressable>}{auth&&<Pressable accessibilityRole="button" accessibilityLabel="Back to welcome" onPress={()=>navigate(step,null,false)} style={s.back}><Icon name="back"/></Pressable>}</View>
      <Animated.View style={[{flexGrow:1},scene.style]}>
      {step<3?<>
        <WelcomeArt key={step} reduced={reduced} icon={details[step].icon} secondary={step===1?"location":step===2?"key":"pin"} tag={details[step].tag}/>
        <Text style={s.kicker}>DISCOVER HOMETAYO · {step+1} OF 3</Text><Text style={s.title}>{details[step].title}</Text><Text style={s.copy}>{details[step].copy}</Text>
        <View style={s.footer}><View style={s.dots}>{details.map((_,i)=><View key={i} style={[s.dot,i===step&&s.activeDot]}/>)}</View><Pressable accessibilityRole="button" style={s.primary} onPress={()=>navigate(step+1,null)}><Text style={s.primaryText}>{step===2?"Get started":"Continue"}</Text><Icon name="arrow"/></Pressable>{step>0&&<Pressable accessibilityRole="button" style={s.link} onPress={()=>navigate(step-1,null,false)}><Text style={s.linkText}>Back</Text></Pressable>}</View>
      </>:mode?<>
        <Text style={[s.kicker,{color:colors.sage}]}>YOUR HOMETAYO EXPERIENCE</Text><AuthIntro key={mode} reduced={reduced}/>
        {mode==="sign-up"&&choosingRole&&<View style={s.roles}>{(["renter","owner"] as const).map(value=><Pressable key={value} accessibilityRole="radio" accessibilityState={{checked:audience===value}} onPress={()=>setAudience(value)} style={[s.role,audience===value&&s.selectedRole]}><View style={s.roleTop}><Icon name={value==="renter"?"home":"building"} color={audience===value?colors.green:colors.sage}/>{audience===value&&<Icon name="check" size={16}/>}</View><Text style={s.roleTitle}>{value==="renter"?"Renter":"Property owner"}</Text><Text style={s.roleCopy}>{value==="renter"?"Find your next home":"List your rental"}</Text></Pressable>)}</View>}
        <AccountForm key={mode} mode={mode} audience={audience} onStageChange={setChoosingRole} onComplete={setSignedIn} onSwitch={()=>navigate(3,mode==="sign-in"?"sign-up":"sign-in",mode==="sign-in")}/>
      </>:<>
        <WelcomeArt reduced={reduced} icon="home" secondary="key" tag="Your next chapter starts here"/>
        <Text style={s.kicker}>WELCOME TO HOMETAYO</Text><Text style={s.title}>{"Find a space.\nFeel at home."}</Text><Text style={s.copy}>Connect with your next home or share a place with someone new.</Text>
        <Pressable accessibilityRole="button" style={s.primary} onPress={()=>navigate(3,"sign-up")}><Text style={s.primaryText}>Create account</Text><Icon name="arrow"/></Pressable><Pressable accessibilityRole="button" style={s.secondary} onPress={()=>navigate(3,"sign-in")}><Text style={s.secondaryText}>Sign in</Text></Pressable><Pressable accessibilityRole="button" style={s.link} onPress={()=>navigate(0,null,false)}><Text style={s.linkText}>How HomeTayo works</Text></Pressable>
      </>}
      {step===3&&<Pressable accessibilityRole="button" style={s.link} onPress={onGuest}><Text style={[s.linkText,auth&&{color:colors.green2}]}>Explore as a guest</Text><Icon name="arrow" size={16} color={auth?colors.green2:"#DFEBE2"}/></Pressable>}
    </Animated.View>
    </ScrollView></KeyboardAvoidingView>
  </SafeAreaView>;
}
const s=StyleSheet.create({authGreeting:{flexDirection:"row",gap:14,alignItems:"center",marginBottom:8},authGreetingIcon:{height:64,width:64,borderRadius:22,backgroundColor:colors.soft,alignItems:"center",justifyContent:"center"},satellite:{position:"absolute",top:30,right:28,height:48,width:48,borderRadius:17,backgroundColor:"#3C7156",alignItems:"center",justifyContent:"center",borderWidth:1,borderColor:"#63866B"},success:{flex:1,justifyContent:"center",alignItems:"center",padding:30},successIcon:{height:140,width:140,borderRadius:46,backgroundColor:"#2D624B",alignItems:"center",justifyContent:"center",marginBottom:35},successCheck:{position:"absolute",right:-5,bottom:0,backgroundColor:"#668B73",borderRadius:20,padding:9,borderWidth:4,borderColor:colors.green},screen:{flex:1,backgroundColor:colors.green},authScreen:{backgroundColor:colors.cream},content:{flexGrow:1,padding:24,paddingBottom:28},header:{flexDirection:"row",alignItems:"center",justifyContent:"space-between",marginBottom:28},brandRow:{flexDirection:"row",gap:9,alignItems:"center"},logo:{width:38,height:38,borderRadius:12},brand:{fontSize:24,fontWeight:"800",color:"white",letterSpacing:-.7},gold:{color:colors.gold},skip:{padding:12},skipText:{color:"#D6E6DC",fontWeight:"700",fontSize:12},back:{padding:10,backgroundColor:colors.white,borderRadius:12},art:{height:235,backgroundColor:"#234F3E",borderRadius:30,alignItems:"center",justifyContent:"center",marginBottom:30,overflow:"hidden"},orbit:{position:"absolute",height:280,width:280,borderRadius:140,borderWidth:1,borderColor:"#386550"},artCircle:{height:160,width:160,borderRadius:80,backgroundColor:"#2D624B",alignItems:"center",justifyContent:"center"},artTag:{position:"absolute",bottom:18,flexDirection:"row",gap:8,alignItems:"center",paddingVertical:10,paddingHorizontal:14,backgroundColor:"#F3E6CC",borderRadius:30},artTagText:{fontSize:11,fontWeight:"700",color:colors.green},kicker:{fontSize:10,letterSpacing:1.8,color:colors.gold,fontWeight:"800",marginBottom:12},title:{fontSize:34,lineHeight:40,fontWeight:"800",color:"white",letterSpacing:-1.1},copy:{fontSize:14,lineHeight:24,color:"#D6E6DC",marginTop:16,marginBottom:24},footer:{marginTop:"auto"},dots:{flexDirection:"row",gap:7,marginBottom:24},dot:{height:6,width:6,borderRadius:6,backgroundColor:"#6C947F"},activeDot:{width:26,backgroundColor:colors.gold},primary:{backgroundColor:"#EED6AD",minHeight:54,borderRadius:16,flexDirection:"row",gap:12,alignItems:"center",justifyContent:"center",padding:14,marginTop:8},primaryText:{color:colors.green,fontWeight:"800",fontSize:15},secondary:{borderWidth:1,borderColor:"#658C78",minHeight:54,borderRadius:16,alignItems:"center",justifyContent:"center",marginTop:12},secondaryText:{color:"white",fontSize:15,fontWeight:"800"},link:{minHeight:48,padding:14,flexDirection:"row",gap:10,alignItems:"center",justifyContent:"center"},linkText:{color:"#DFEBE2",fontSize:12,fontWeight:"700"},authTitle:{fontSize:30,fontWeight:"800",color:colors.green,letterSpacing:-1},authCopy:{fontSize:13,lineHeight:21,color:colors.muted,marginTop:8,marginBottom:18},roles:{flexDirection:"row",gap:10},role:{flex:1,padding:15,borderRadius:18,borderWidth:1,borderColor:colors.border,backgroundColor:colors.white},selectedRole:{borderColor:colors.green2,backgroundColor:colors.soft},roleTop:{flexDirection:"row",alignItems:"center",justifyContent:"space-between",marginBottom:12},roleTitle:{fontSize:13,fontWeight:"800",color:colors.green},roleCopy:{fontSize:11,lineHeight:17,color:colors.muted,marginTop:5}});
