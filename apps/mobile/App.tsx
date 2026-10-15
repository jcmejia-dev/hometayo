import React, { useEffect, useState } from "react";
import {
  ActivityIndicator, Alert, Animated, BackHandler, Image, Linking,
  Pressable, ScrollView, StatusBar, StyleSheet, Text, TextInput, View,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import {Icon,type IconName} from "./src/icons";
import { colors } from "./src/design";
import { NativeWelcome } from "./src/welcome";
import {restoreAccount,watchSessionExpired,type Account} from "./src/session";
import {RentalMap} from "./src/rental-map";
import {AccountPanel} from "./src/account-panel";
import { fetchRentalDetail, propertyLabel, rentLabel, type RentalDetail } from "./src/api";

import {ThemeProvider,useTheme} from "./src/theme";
import {useReducedMotion,useSceneTransition} from "./src/motion";
import {api} from "./src/session";
import {isExpoGo} from "./src/runtime";
import {demoRentals,type DemoRental} from "./src/demo-rentals";

type Tab = "home" | "explore" | "owner" | "profile";
const tabs: Array<{id:Tab;label:string;symbol:IconName}> = [
  {id:"home",label:"Home",symbol:"home"},
  {id:"explore",label:"Explore",symbol:"search"},
  {id:"owner",label:"My listings",symbol:"building"},
  {id:"profile",label:"Profile",symbol:"user"},
];
const INTRO_KEY="hometayo.native.intro.v1";


function PrimaryButton({text,onPress,outlined=false}:{
  text:string;onPress:()=>void;outlined?:boolean;
}){
  const {theme}=useTheme();
  return <Pressable accessibilityRole="button" onPress={onPress}
    style={({pressed})=>[styles.primaryButton,{backgroundColor:theme.accent},outlined&&styles.outlineButton,pressed&&styles.pressed]}>
    <Text style={[styles.primaryButtonText,outlined&&styles.outlineButtonText]}>{text}</Text><Icon name="arrow" size={18} color={outlined?colors.green:"white"}/>
  </Pressable>;
}
function Brand({subtitle}:{subtitle?:string}){
  return <View style={styles.brandWrap}>
    <Image source={require("./assets/icon.png")} style={{width:34,height:34,borderRadius:10}} accessibilityLabel="HomeTayo icon"/>
    <View><Text style={styles.brandWord}>Home<Text style={styles.brandGold}>Tayo</Text></Text>
      {subtitle?<Text style={styles.brandSubtitle}>{subtitle}</Text>:null}
    </View>
  </View>;
}
function NativeApp(){
  const {theme}=useTheme();
  const [ready,setReady]=useState(false);
  const [account,setAccount]=useState<Account|null>(null);
  const [welcomeOpen,setWelcomeOpen]=useState(true);
  const [intro,setIntro]=useState<number|null>(null);
  const [tab,setTab]=useState<Tab>("home");
  const [city,setCity]=useState("");
  const [budget,setBudget]=useState("");
  const [type,setType]=useState("");



  const [selected,setSelected]=useState<(RentalDetail & Partial<DemoRental>)|null>(null);
  const [selectedSlug,setSelectedSlug]=useState<string|null>(null);
  const [detailBusy,setDetailBusy]=useState(false);
  const reduced=useReducedMotion();
  const transition=useSceneTransition(tab+":"+(selectedSlug||""),reduced);
  useEffect(()=>{if(!account)return;let active=true;api("/api/mobile/profile").then(data=>{if(active){setCity(data.profile.homeCity||"");setType(data.profile.preferredPropertyType||"");setBudget(data.profile.preferredBudgetPesos==null?"":String(data.profile.preferredBudgetPesos));}}).catch(()=>{});return()=>{active=false;};},[account]);
  useEffect(()=>watchSessionExpired(()=>{setAccount(null);setWelcomeOpen(true);setIntro(null);}),[]);

  useEffect(()=>{
    let alive=true;
    Promise.all([AsyncStorage.getItem(INTRO_KEY),restoreAccount().catch(()=>null)]).then(([value,saved])=>{
      if(!alive)return;
      setAccount(saved);if(saved)setWelcomeOpen(false);
      setIntro(value==="done"?null:0);setReady(true);
    }).catch(()=>{if(alive){setIntro(0);setReady(true);}});
    return()=>{alive=false;};
  },[]);

  useEffect(()=>{
    if(!selectedSlug)return;
    const demo=isExpoGo?demoRentals.find(r=>r.slug===selectedSlug):undefined;
    if(demo){setSelected(demo);setDetailBusy(false);return;}
    let active=true;
    const ctrl=new AbortController();
    setDetailBusy(true);setSelected(null);
    fetchRentalDetail(selectedSlug,ctrl.signal)
      .then(item=>{if(active)setSelected(item);})
      .catch(error=>{if(active){Alert.alert("Rental unavailable",error instanceof Error?error.message:"Try again later.");setSelectedSlug(null);}})
      .finally(()=>{if(active)setDetailBusy(false);});
    return()=>{active=false;ctrl.abort();};
  },[selectedSlug]);

  useEffect(()=>{
    const subscription=BackHandler.addEventListener("hardwareBackPress",()=>{
      if(selectedSlug){setSelectedSlug(null);return true;}
      if(intro!==null&&intro>0){setIntro(intro-1);return true;}
      if(tab!=="home"){setTab("home");return true;}
      return false;
    });
    return()=>subscription.remove();
  },[selectedSlug,intro,tab]);

  function finishTutorial(nextTab:Tab="home"){
    void AsyncStorage.setItem(INTRO_KEY,"done").catch(()=>{});
    setIntro(null);setWelcomeOpen(false);setTab(nextTab);
  }
  if(!ready)return <SafeAreaView style={[styles.container,{backgroundColor:theme.background}]}><ActivityIndicator style={{marginTop:80}} color={colors.green}/></SafeAreaView>;
  if(welcomeOpen)return <NativeWelcome returning={intro===null} onGuest={()=>finishTutorial("home")} onSignedIn={user=>{setAccount(user);finishTutorial(user.role==="landlord"?"owner":"home");}}/>;
  return <SafeAreaView style={[styles.container,{backgroundColor:theme.background}]}>
    <StatusBar barStyle="dark-content" backgroundColor={theme.background}/>
    <View style={styles.header}><Brand/><Text style={[styles.headerTag,{color:theme.accent}]}>{tab==="explore"?"EXPLORE":tab==="owner"?"OWNER":tab==="profile"?"ACCOUNT":"DISCOVER"}</Text></View>
    <Animated.View style={[{flex:1},transition.style]}>
    {selectedSlug ? <ScrollView contentContainerStyle={styles.tabBody}>
      <Pressable accessibilityRole="button" onPress={()=>setSelectedSlug(null)}><Text style={styles.inlineLink}>← Back to rentals</Text></Pressable>
      {detailBusy ? <ActivityIndicator color={colors.green} size="large" style={{marginTop:55}}/> : selected ? <>
        {selected.demo&&<Text style={styles.eyebrow}>DEMO PROPERTY - NOT AVAILABLE FOR RENT</Text>}
        <View style={styles.detailHero}><View style={styles.detailIllustration}><Icon name="home" size={68} color={colors.sage}/></View><Text style={styles.detailPlaceholder}>Property photographs are not available yet</Text></View>
        <Text style={styles.eyebrow}>{propertyLabel(selected.propertyType).toUpperCase()}</Text>
        <Text style={styles.title}>{selected.title}</Text>
        <Text style={styles.paragraph}>{selected.barangay}, {selected.city}, {selected.province}</Text>
        <Text style={styles.detailPrice}>{rentLabel(selected.monthlyRentCentavos)}<Text style={styles.perMonth}> /month</Text></Text>
        <View style={styles.detailFacts}><View style={styles.fact}><Icon name="bed" size={20}/><Text style={styles.factLabel}>{selected.bedrooms ?? "—"} beds</Text></View><View style={styles.fact}><Icon name="bath" size={20}/><Text style={styles.factLabel}>{selected.bathrooms ?? "—"} baths</Text></View><View style={styles.fact}><Icon name="key" size={20}/><Text style={styles.factLabel}>{({yes:"Furnished",no:"Unfurnished",partial:"Part furnished",unspecified:"Not specified"} as Record<string,string>)[selected.furnished]||"Not specified"}</Text></View></View>
        <Text style={styles.sectionTitle}>About this rental</Text>
        <Text style={styles.paragraph}>{selected.description}</Text>
        {selected.inclusions&&<><Text style={styles.sectionTitle}>Inclusions & amenities</Text>{selected.inclusions.map(item=><View key={item} style={styles.amenity}><Icon name={item.includes("Wi-Fi")?"wifi":"check"} size={19}/><Text style={styles.infoText}>{item}</Text></View>)}<Text style={styles.paragraph}>Electricity is billed separately. Sample terms: one month deposit and one month advance.</Text><Text style={styles.paragraph}>{selected.availableSlots?selected.availableSlots+" sample slots":"Whole unit"}</Text></>}
        {!selected.demo&&<Text style={styles.disclaimer}>Admin review does not guarantee property ownership, condition or safety. Verify details independently before paying.</Text>}
        {selected.contactUrl?<PrimaryButton text="Contact property owner" onPress={()=>{
          const url=selected.contactUrl;
          if(url && (url.startsWith("https://")||url.startsWith("tel:")))
            void Linking.openURL(url).catch(()=>Alert.alert("Unable to open contact link"));
        }}/>:<Text style={styles.disclaimer}>{selected.demo?"Demo only - contacting or booking is disabled.":"The owner has not provided a public contact link."}</Text>}
      </>:null}
    </ScrollView> :
    tab==="home" ? <ScrollView contentContainerStyle={styles.tabBody}>
      <Text style={styles.eyebrow}>HANAP BAHAY. DITO TAYO.</Text>
      <Text style={styles.heroTitle}>Find a place <Text style={{color:colors.sage}}>to call home.</Text></Text>
      <Text style={styles.paragraph}>Homes, rooms and new beginnings. Explore rentals near the places that matter to you.</Text><View style={[styles.homeArt,{backgroundColor:theme.accent}]}><View style={styles.homeArtCopy}><Text style={styles.homeArtTitle}>A neighbourhood
you’ll love.</Text><Text style={styles.homeArtText}>Explore homes on the map</Text></View><View style={styles.homeArtIcon}><Icon name="home" size={52} color="#EED6AD"/></View></View>
      <View style={styles.searchCard}>
        <Text style={styles.fieldLabel}>YOUR LOCATION</Text>
        <TextInput accessibilityLabel="City" value={city} onChangeText={setCity} placeholder="City or municipality"
          placeholderTextColor="#91A395" style={styles.cityInput} returnKeyType="search" onSubmitEditing={()=>setTab("explore")}/>
        <Text style={styles.fieldLabel}>PROPERTY TYPE</Text>
        <View style={styles.filterRow}>
          {["","house","apartment","boarding_house","bedspace"].map(v=><Pressable key={v} onPress={()=>setType(v)} accessibilityRole="button"
            style={[styles.filterChip,v===type&&styles.filterChipActive]}><Text style={[styles.filterText,v===type&&styles.filterActiveText]}>{v?propertyLabel(v):"Any"}</Text></Pressable>)}
        </View>
        <PrimaryButton text="Explore rentals" onPress={()=>setTab("explore")}/>
      </View>
      <Text style={styles.sectionTitle}>How HomeTayo works</Text>
      <View style={styles.infoRow}><View style={styles.infoIcon}><Icon name="pin" size={20}/></View><Text style={styles.infoText}>Search by location and property type.</Text></View>
      <View style={styles.infoRow}><View style={styles.infoIcon}><Icon name="search" size={20}/></View><Text style={styles.infoText}>Review approved property details.</Text></View>
      <View style={styles.infoRow}><View style={styles.infoIcon}><Icon name="shield" size={20}/></View><Text style={styles.infoText}>Verify the home and owner before making payments.</Text></View>
      <Pressable accessibilityRole="button" onPress={()=>{setIntro(0);setWelcomeOpen(true);}} style={styles.textAction}><Text style={styles.inlineLink}>Replay introduction →</Text></Pressable>
    </ScrollView> :
    tab==="explore" ? <RentalMap account={account} onSelect={setSelectedSlug} initialCity={city} initialType={type} initialBudget={budget}/> :
    <AccountPanel account={account} owner={tab==="owner"} onAccountChange={setAccount} onLogin={()=>{setIntro(null);setWelcomeOpen(true);}}/>}
    </Animated.View>
    <View style={styles.tabBar}>{tabs.filter(t=>t.id!=="owner"||account?.role==="landlord").map(t=><Pressable key={t.id} onPress={()=>{if(t.id===tab&&!selectedSlug)return;transition.change(()=>{setSelectedSlug(null);setTab(t.id);},tabs.findIndex(v=>v.id===t.id)>tabs.findIndex(v=>v.id===tab));}}
      accessibilityRole="tab" accessibilityState={{selected:tab===t.id}} style={[styles.tab,t.id===tab&&{backgroundColor:theme.soft}]}>
      <Icon name={t.symbol} size={23} color={t.id===tab?theme.accent:colors.muted}/>
      <Text style={[styles.tabLabel,t.id===tab&&{color:theme.accent}]}>{t.label}</Text>
    </Pressable>)}</View>
  </SafeAreaView>;
}
export default function App(){return <SafeAreaProvider><ThemeProvider><NativeApp/></ThemeProvider></SafeAreaProvider>;}

const styles=StyleSheet.create({
  homeArt:{flexDirection:"row",alignItems:"center",justifyContent:"space-between",backgroundColor:colors.green,borderRadius:24,padding:22,marginVertical:8},homeArtCopy:{flex:1},homeArtTitle:{fontSize:20,lineHeight:26,fontWeight:"800",color:colors.white},homeArtText:{fontSize:11,color:"#C8DDCF",marginTop:9},homeArtIcon:{width:85,height:85,borderRadius:28,backgroundColor:colors.green2,alignItems:"center",justifyContent:"center"},infoIcon:{height:40,width:40,borderRadius:13,backgroundColor:colors.soft,alignItems:"center",justifyContent:"center"},detailIllustration:{padding:20,borderRadius:32,backgroundColor:"#DCE8DE",marginBottom:12},fact:{flex:1,alignItems:"center",gap:9},factLabel:{fontSize:11,color:colors.green,textAlign:"center"},amenity:{flexDirection:"row",gap:12,alignItems:"center",backgroundColor:colors.white,padding:14,borderRadius:13,marginBottom:8},
  container:{flex:1,backgroundColor:colors.cream},tabBody:{padding:22,paddingBottom:48},
  header:{height:63,paddingHorizontal:20,borderBottomWidth:1,borderColor:colors.border,backgroundColor:colors.white,flexDirection:"row",alignItems:"center",justifyContent:"space-between"},
  brandWrap:{flexDirection:"row",alignItems:"center",gap:9},
  brandIcon:{backgroundColor:colors.green,width:34,height:34,borderRadius:10,alignItems:"center",justifyContent:"center"},
  brandHouse:{color:"#fff8eb",fontSize:34,fontWeight:"600",marginTop:-5},
  brandPin:{position:"absolute",width:8,height:8,borderRadius:4,backgroundColor:colors.gold,bottom:8},
  brandWord:{fontSize:21,fontWeight:"800",color:colors.green,letterSpacing:-.5},
  brandGold:{color:colors.gold},brandSubtitle:{fontSize:10,color:colors.muted},
  headerTag:{color:colors.muted,fontSize:10,fontWeight:"800",letterSpacing:1},
  eyebrow:{fontSize:11,color:colors.sage,fontWeight:"800",letterSpacing:1.4,marginBottom:10},
  heroTitle:{fontSize:36,fontWeight:"800",lineHeight:41,color:colors.green,letterSpacing:-1.1,marginBottom:12},
  title:{fontSize:30,fontWeight:"800",color:colors.green,letterSpacing:-.9,marginBottom:8},
  paragraph:{fontSize:13,lineHeight:21,color:colors.muted,marginBottom:14},
  searchCard:{backgroundColor:colors.white,padding:18,borderWidth:1,borderColor:colors.border,borderRadius:22,marginTop:10,gap:12},
  fieldLabel:{fontSize:10,fontWeight:"800",color:colors.muted,letterSpacing:.7},
  cityInput:{borderWidth:1,borderColor:colors.border,borderRadius:10,height:47,paddingHorizontal:13,backgroundColor:"#FCFDFB",fontSize:14,color:colors.ink,marginBottom:5},
  filterRow:{flexDirection:"row",flexWrap:"wrap",gap:7},
  filtersScroll:{gap:7,paddingVertical:8},
  filterChip:{minHeight:38,borderRadius:9,borderWidth:1,borderColor:colors.border,backgroundColor:colors.white,paddingHorizontal:11,alignItems:"center",justifyContent:"center"},
  filterChipActive:{backgroundColor:colors.green,borderColor:colors.green},
  filterText:{fontSize:11,fontWeight:"700",color:colors.ink},
  filterActiveText:{color:colors.white},
  primaryButton:{flexDirection:"row",gap:10,backgroundColor:colors.green,marginTop:5,minHeight:46,borderRadius:14,alignItems:"center",justifyContent:"center",paddingHorizontal:16},
  primaryButtonText:{color:colors.white,fontSize:14,fontWeight:"800"},
  outlineButton:{backgroundColor:colors.white,borderWidth:1,borderColor:colors.border},
  outlineButtonText:{color:colors.green},
  pressed:{opacity:.8},
  sectionTitle:{fontSize:18,fontWeight:"800",color:colors.green,marginTop:26,marginBottom:15},
  infoRow:{flexDirection:"row",alignItems:"center",gap:13,marginBottom:13},
  infoBullet:{fontSize:12,color:colors.sage,fontWeight:"800"},
  infoText:{fontSize:13,color:colors.ink,flex:1},
  textAction:{paddingVertical:12,alignSelf:"flex-start"},inlineLink:{color:colors.green2,fontWeight:"800",fontSize:13},
  searchHead:{backgroundColor:colors.cream,padding:20,paddingBottom:14,gap:6},
  listContent:{padding:18,paddingBottom:35,flexGrow:1},
  rentalCard:{backgroundColor:colors.white,borderRadius:14,padding:15,borderWidth:1,borderColor:colors.border,marginBottom:10,flexDirection:"row",gap:11,alignItems:"center"},
  rentalIcon:{height:66,width:66,borderRadius:12,backgroundColor:colors.soft,alignItems:"center",justifyContent:"center"},
  rentalHouse:{fontSize:36,color:colors.green},
  rentalCopy:{flex:1},rentalType:{fontSize:9,fontWeight:"800",letterSpacing:.8,color:colors.sage,marginBottom:4},
  rentalTitle:{fontSize:14,fontWeight:"800",color:colors.ink,marginBottom:4},
  rentalArea:{fontSize:11,color:colors.muted,marginBottom:7},
  rentalPrice:{fontSize:15,fontWeight:"800",color:colors.green2},
  perMonth:{fontSize:10,fontWeight:"500",color:colors.muted},
  arrow:{fontSize:25,color:colors.sage},emptyCard:{backgroundColor:colors.white,borderRadius:17,padding:24,borderWidth:1,borderColor:colors.border,alignItems:"stretch",marginTop:16,gap:10},
  cardSymbol:{fontSize:32,color:colors.green2,textAlign:"center"},
  cardTitle:{fontSize:19,fontWeight:"800",color:colors.green,textAlign:"center"},
  tabBar:{backgroundColor:colors.white,borderTopWidth:1,borderColor:colors.border,height:64,flexDirection:"row",paddingHorizontal:7},
  tab:{flex:1,alignItems:"center",justifyContent:"center",gap:3,borderRadius:11},
  tabActive:{backgroundColor:colors.soft},tabSymbol:{fontSize:23,color:colors.muted},
  tabLabel:{fontSize:10,color:colors.muted,fontWeight:"800"},tabSelected:{color:colors.green},
  detailHero:{height:175,backgroundColor:colors.soft,borderRadius:18,alignItems:"center",justifyContent:"center",marginVertical:19},
  detailHouse:{fontSize:66,color:colors.green},
  detailPlaceholder:{fontSize:11,color:colors.muted},
  detailPrice:{fontSize:27,fontWeight:"800",color:colors.green,marginVertical:13},
  detailFacts:{flexDirection:"row",gap:8,padding:15,backgroundColor:colors.white,borderRadius:18},
  disclaimer:{color:colors.muted,fontSize:11,lineHeight:17,marginTop:14},
  introPage:{flex:1,backgroundColor:colors.green,paddingHorizontal:24},
  introTop:{flexDirection:"row",alignItems:"center",justifyContent:"space-between",paddingTop:18},
  introSkip:{paddingVertical:12,paddingHorizontal:10},introSkipText:{color:"#E1ECDF",fontSize:13,fontWeight:"800"},
  introCenter:{flex:1,alignItems:"center",justifyContent:"center"},
  introCircle:{height:160,width:160,borderRadius:80,backgroundColor:"#2C634B",alignItems:"center",justifyContent:"center",marginBottom:28,borderWidth:1,borderColor:"#599071"},
  introIllustration:{fontSize:95,color:"#F7F0DF"},
  introStep:{fontSize:10,fontWeight:"800",color:"#D7BC87",letterSpacing:1.8,marginBottom:13},
  introTitle:{fontSize:32,fontWeight:"800",color:colors.white,textAlign:"center",lineHeight:39,letterSpacing:-1},
  introDescription:{fontSize:14,lineHeight:22,color:"#DBE9DD",textAlign:"center",marginTop:17,maxWidth:330},
  dots:{flexDirection:"row",gap:6,marginTop:28},
  dot:{height:7,width:7,borderRadius:7,backgroundColor:"#749A84"},dotActive:{width:24,backgroundColor:colors.gold},
  introBottom:{paddingBottom:22,gap:10},
  introNext:{flexDirection:"row",alignItems:"center",gap:12},
  backButton:{paddingHorizontal:9},backText:{color:colors.white,fontWeight:"700"},
  guestButton:{minHeight:45,alignItems:"center",justifyContent:"center"},
  guestText:{color:"#E6F0E3",fontWeight:"800",fontSize:13},
});
