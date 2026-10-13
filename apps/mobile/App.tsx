import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator, Alert, BackHandler, FlatList, Image, Linking,
  Platform, Pressable, ScrollView, StatusBar, StyleSheet, Text, TextInput, View,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { colors } from "./src/design";
import { fetchRentalDetail, fetchRentals, propertyLabel, rentLabel, type Rental, type RentalDetail } from "./src/api";

type Tab = "home" | "explore" | "owner" | "profile";
const tabs: Array<{id:Tab;label:string;symbol:string}> = [
  {id:"home",label:"Home",symbol:"⌂"},
  {id:"explore",label:"Explore",symbol:"⌕"},
  {id:"owner",label:"My listings",symbol:"▤"},
  {id:"profile",label:"Profile",symbol:"◯"},
];
const tutorial=[
  {title:"Find your next home",description:"Discover houses, apartments, boarding houses and bedspaces that fit."},
  {title:"Search on your terms",description:"Choose a location and browse real, approved rental listings."},
  {title:"Have a place to rent?",description:"Submit a property on HomeTayo and track its review status."},
];
const INTRO_KEY="hometayo.native.intro.v1";
const WEB_ORIGIN="https://hometayo-snyn.vercel.app";

function PrimaryButton({text,onPress,outlined=false}:{
  text:string;onPress:()=>void;outlined?:boolean;
}){
  return <Pressable accessibilityRole="button" onPress={onPress}
    style={({pressed})=>[styles.primaryButton,outlined&&styles.outlineButton,pressed&&styles.pressed]}>
    <Text style={[styles.primaryButtonText,outlined&&styles.outlineButtonText]}>{text}</Text>
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
function openWebsite(path:string){
  // Only trusted fixed routes. Never accept server-supplied arbitrary URLs here.
  void Linking.openURL(WEB_ORIGIN+path).catch(()=>Alert.alert("Unable to open HomeTayo","Please try again."));
}
function AccountGate({mode}:{mode:"owner"|"profile"}){
  return <ScrollView contentContainerStyle={styles.tabBody}>
    <Text style={styles.eyebrow}>{mode==="owner"?"PROPERTY MANAGEMENT":"YOUR ACCOUNT"}</Text>
    <Text style={styles.title}>{mode==="owner"?"Manage your rentals.":"Make HomeTayo yours."}</Text>
    <Text style={styles.paragraph}>{mode==="owner"
      ?"Submit authorized properties, follow the approval queue, and update their availability."
      :"Create an account or sign in to save rental preferences and access your profile."}</Text>
    <View style={styles.emptyCard}>
      <Text style={styles.cardSymbol}>{mode==="owner"?"▤":"◯"}</Text>
      <Text style={styles.cardTitle}>Secure account access</Text>
      <Text style={styles.paragraph}>For this native preview, sign-in and owner actions open HomeTayo's secure website.
        Native app authentication will be integrated in a later milestone; the app does not store website passwords or pretend to be signed in.</Text>
      <PrimaryButton text="Sign in" onPress={()=>openWebsite("/sign-in")}/>
      <PrimaryButton text="Create account" outlined onPress={()=>openWebsite("/sign-up")}/>
      {mode==="owner"?<Pressable accessibilityRole="button" onPress={()=>openWebsite("/owner")} style={styles.textAction}>
        <Text style={styles.inlineLink}>Open property dashboard →</Text>
      </Pressable>:null}
    </View>
  </ScrollView>;
}
function NativeApp(){
  const [ready,setReady]=useState(false);
  const [intro,setIntro]=useState<number|null>(null);
  const [tab,setTab]=useState<Tab>("home");
  const [city,setCity]=useState("Koronadal City");
  const [type,setType]=useState("");
  const [rentals,setRentals]=useState<Rental[]>([]);
  const [error,setError]=useState<string|null>(null);
  const [loading,setLoading]=useState(false);
  const [selected,setSelected]=useState<RentalDetail|null>(null);
  const [selectedSlug,setSelectedSlug]=useState<string|null>(null);
  const [detailBusy,setDetailBusy]=useState(false);

  useEffect(()=>{
    let alive=true;
    AsyncStorage.getItem(INTRO_KEY).then(value=>{
      if(!alive)return;
      setIntro(value==="done"?null:0);setReady(true);
    }).catch(()=>{if(alive){setIntro(0);setReady(true);}});
    return()=>{alive=false;};
  },[]);

  const load=useCallback(async()=>{
    setLoading(true);setError(null);
    try {setRentals(await fetchRentals(city,type));}
    catch(e){setRentals([]);setError(e instanceof Error?e.message:"Could not load rentals.");}
    finally{setLoading(false);}
  },[city,type]);

  useEffect(()=>{if(tab==="explore" && ready && intro===null)void load();},[tab,ready,intro,load]);

  useEffect(()=>{
    if(!selectedSlug)return;
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
    setIntro(null);setTab(nextTab);
  }
  if(!ready)return <SafeAreaView style={styles.container}><ActivityIndicator style={{marginTop:80}} color={colors.green}/></SafeAreaView>;
  if(intro!==null)return <SafeAreaView style={styles.introPage}>
    <StatusBar barStyle="light-content" backgroundColor={colors.green}/>
    <View style={styles.introTop}><Brand/><Pressable accessibilityRole="button" onPress={()=>finishTutorial()} style={styles.introSkip}><Text style={styles.introSkipText}>Skip</Text></Pressable></View>
    <View style={styles.introCenter}>
      <View style={styles.introCircle}><Text style={styles.introIllustration}>{intro===0?"⌂":intro===1?"⌖":intro===2?"▤":"✓"}</Text></View>
      {intro < 3 ? <>
        <Text style={styles.introStep}>STEP {intro+1} OF 3</Text>
        <Text style={styles.introTitle}>{tutorial[intro].title}</Text>
        <Text style={styles.introDescription}>{tutorial[intro].description}</Text>
        <View style={styles.dots}>{tutorial.map((_,i)=><View key={i} style={[styles.dot,intro===i&&styles.dotActive]}/>)}</View>
      </> : <>
        <Text style={styles.introStep}>WELCOME TO HOMETAYO</Text>
        <Text style={styles.introTitle}>Your next chapter starts here.</Text>
        <Text style={styles.introDescription}>Explore rentals as a guest. Sign in when you want an account.</Text>
      </>}
    </View>
    <View style={styles.introBottom}>
      {intro===3 ? <>
        <PrimaryButton text="Create account" onPress={()=>{finishTutorial();openWebsite("/sign-up");}}/>
        <PrimaryButton text="Sign in" outlined onPress={()=>{finishTutorial();openWebsite("/sign-in");}}/>
        <Pressable onPress={()=>finishTutorial("explore")} accessibilityRole="button" style={styles.guestButton}><Text style={styles.guestText}>Explore as guest →</Text></Pressable>
      </> : <View style={styles.introNext}>
        {intro>0 ? <Pressable onPress={()=>setIntro(intro-1)} accessibilityRole="button" style={styles.backButton}><Text style={styles.backText}>← Back</Text></Pressable>:null}
        <View style={{flex:1}}><PrimaryButton text={intro===2?"Get started →":"Next →"} onPress={()=>setIntro(intro+1)}/></View>
      </View>}
    </View>
  </SafeAreaView>;

  function renderRental({item}:{item:Rental}){
    return <Pressable accessibilityRole="button" accessibilityLabel={"View "+item.title}
      onPress={()=>setSelectedSlug(item.slug)} style={styles.rentalCard}>
      <View style={styles.rentalIcon}><Text style={styles.rentalHouse}>⌂</Text></View>
      <View style={styles.rentalCopy}>
        <Text style={styles.rentalType}>{propertyLabel(item.propertyType).toUpperCase()}</Text>
        <Text style={styles.rentalTitle} numberOfLines={2}>{item.title}</Text>
        <Text style={styles.rentalArea}>{item.barangay}, {item.city}</Text>
        <Text style={styles.rentalPrice}>{rentLabel(item.monthlyRentCentavos)}<Text style={styles.perMonth}> /month</Text></Text>
      </View>
      <Text style={styles.arrow}>›</Text>
    </Pressable>;
  }

  return <SafeAreaView style={styles.container}>
    <StatusBar barStyle="dark-content" backgroundColor={colors.cream}/>
    <View style={styles.header}><Brand/><Text style={styles.headerTag}>{tab==="explore"?"EXPLORE":tab==="owner"?"OWNER":tab==="profile"?"ACCOUNT":"DISCOVER"}</Text></View>
    {selectedSlug ? <ScrollView contentContainerStyle={styles.tabBody}>
      <Pressable accessibilityRole="button" onPress={()=>setSelectedSlug(null)}><Text style={styles.inlineLink}>← Back to rentals</Text></Pressable>
      {detailBusy ? <ActivityIndicator color={colors.green} size="large" style={{marginTop:55}}/> : selected ? <>
        <View style={styles.detailHero}><Text style={styles.detailHouse}>⌂</Text><Text style={styles.detailPlaceholder}>Property photographs are not available yet</Text></View>
        <Text style={styles.eyebrow}>{propertyLabel(selected.propertyType).toUpperCase()}</Text>
        <Text style={styles.title}>{selected.title}</Text>
        <Text style={styles.paragraph}>{selected.barangay}, {selected.city}, {selected.province}</Text>
        <Text style={styles.detailPrice}>{rentLabel(selected.monthlyRentCentavos)}<Text style={styles.perMonth}> /month</Text></Text>
        <View style={styles.detailFacts}><Text>{selected.bedrooms ?? "—"} beds</Text><Text>{selected.bathrooms ?? "—"} baths</Text><Text>{selected.furnished} furnished</Text></View>
        <Text style={styles.sectionTitle}>About this rental</Text>
        <Text style={styles.paragraph}>{selected.description}</Text>
        <Text style={styles.disclaimer}>Admin review does not guarantee property ownership, condition or safety. Verify details independently before paying.</Text>
        {selected.contactUrl?<PrimaryButton text="Contact property owner" onPress={()=>{
          const url=selected.contactUrl;
          if(url && (url.startsWith("https://")||url.startsWith("tel:")))
            void Linking.openURL(url).catch(()=>Alert.alert("Unable to open contact link"));
        }}/>:<Text style={styles.disclaimer}>The owner has not provided a public contact link.</Text>}
      </>:null}
    </ScrollView> :
    tab==="home" ? <ScrollView contentContainerStyle={styles.tabBody}>
      <Text style={styles.eyebrow}>HANAP BAHAY. DITO TAYO.</Text>
      <Text style={styles.heroTitle}>Find a place <Text style={{color:colors.sage}}>to call home.</Text></Text>
      <Text style={styles.paragraph}>Search genuine, approved rentals. No account needed.</Text>
      <View style={styles.searchCard}>
        <Text style={styles.fieldLabel}>YOUR LOCATION</Text>
        <TextInput accessibilityLabel="City" value={city} onChangeText={setCity} placeholder="City or municipality"
          placeholderTextColor="#91A395" style={styles.cityInput} returnKeyType="search" onSubmitEditing={()=>setTab("explore")}/>
        <Text style={styles.fieldLabel}>PROPERTY TYPE</Text>
        <View style={styles.filterRow}>
          {["","house","apartment","bedspace"].map(v=><Pressable key={v} onPress={()=>setType(v)} accessibilityRole="button"
            style={[styles.filterChip,v===type&&styles.filterChipActive]}><Text style={[styles.filterText,v===type&&styles.filterActiveText]}>{v?propertyLabel(v):"Any"}</Text></Pressable>)}
        </View>
        <PrimaryButton text="Explore rentals →" onPress={()=>setTab("explore")}/>
      </View>
      <Text style={styles.sectionTitle}>How HomeTayo works</Text>
      <View style={styles.infoRow}><Text style={styles.infoBullet}>01</Text><Text style={styles.infoText}>Search by location and property type.</Text></View>
      <View style={styles.infoRow}><Text style={styles.infoBullet}>02</Text><Text style={styles.infoText}>Review approved property details.</Text></View>
      <View style={styles.infoRow}><Text style={styles.infoBullet}>03</Text><Text style={styles.infoText}>Verify the home and owner before making payments.</Text></View>
      <Pressable accessibilityRole="button" onPress={()=>setIntro(0)} style={styles.textAction}><Text style={styles.inlineLink}>Replay introduction →</Text></Pressable>
    </ScrollView> :
    tab==="explore" ? <View style={{flex:1}}>
      <View style={styles.searchHead}>
        <Text style={styles.title}>Explore rentals</Text>
        <Text style={styles.paragraph}>Only administrator-approved listings appear.</Text>
        <TextInput value={city} onChangeText={setCity} accessibilityLabel="Search city" placeholder="City or municipality"
          style={styles.cityInput} placeholderTextColor="#91A395" onSubmitEditing={()=>void load()}/>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filtersScroll}>
          {["","house","apartment","boarding_house","bedspace"].map(v=><Pressable key={v} accessibilityRole="button"
            onPress={()=>setType(v)} style={[styles.filterChip,v===type&&styles.filterChipActive]}>
            <Text style={[styles.filterText,v===type&&styles.filterActiveText]}>{v?propertyLabel(v):"All types"}</Text>
          </Pressable>)}
        </ScrollView>
        <PrimaryButton text="Search" onPress={()=>void load()}/>
      </View>
      {loading?<ActivityIndicator color={colors.green} size="large" style={{marginTop:45}}/>:
      error?<View style={styles.emptyCard}><Text style={styles.cardTitle}>Search unavailable</Text><Text style={styles.paragraph}>{error}</Text><PrimaryButton text="Try again" onPress={()=>void load()}/></View>:
      <FlatList data={rentals} keyExtractor={r=>r.slug} renderItem={renderRental}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={<View style={styles.emptyCard}><Text style={styles.cardSymbol}>⌂</Text>
          <Text style={styles.cardTitle}>No approved rentals yet</Text>
          <Text style={styles.paragraph}>Try a different city or property type. We never display fictional listings.</Text></View>}/>}
    </View> :
    <AccountGate mode={tab}/>}
    <View style={styles.tabBar}>{tabs.map(t=><Pressable key={t.id} onPress={()=>{setSelectedSlug(null);setTab(t.id);}}
      accessibilityRole="tab" accessibilityState={{selected:tab===t.id}} style={[styles.tab,t.id===tab&&styles.tabActive]}>
      <Text style={[styles.tabSymbol,t.id===tab&&styles.tabSelected]}>{t.symbol}</Text>
      <Text style={[styles.tabLabel,t.id===tab&&styles.tabSelected]}>{t.label}</Text>
    </Pressable>)}</View>
  </SafeAreaView>;
}
export default function App(){return <SafeAreaProvider><NativeApp/></SafeAreaProvider>;}

const styles=StyleSheet.create({
  container:{flex:1,backgroundColor:colors.cream},tabBody:{padding:22,paddingBottom:48},
  header:{height:63,paddingHorizontal:20,borderBottomWidth:1,borderColor:colors.border,backgroundColor:colors.white,flexDirection:"row",alignItems:"center",justifyContent:"space-between"},
  brandWrap:{flexDirection:"row",alignItems:"center",gap:9},
  brandIcon:{backgroundColor:colors.green,width:34,height:34,borderRadius:10,alignItems:"center",justifyContent:"center"},
  brandHouse:{color:"#fff8eb",fontSize:34,fontWeight:"600",marginTop:-5},
  brandPin:{position:"absolute",width:8,height:8,borderRadius:4,backgroundColor:colors.gold,bottom:8},
  brandWord:{fontSize:21,fontWeight:"900",color:colors.green,letterSpacing:-.5},
  brandGold:{color:colors.gold},brandSubtitle:{fontSize:10,color:colors.muted},
  headerTag:{color:colors.muted,fontSize:10,fontWeight:"800",letterSpacing:1},
  eyebrow:{fontSize:11,color:colors.sage,fontWeight:"800",letterSpacing:1.4,marginBottom:10},
  heroTitle:{fontSize:36,fontWeight:"900",lineHeight:41,color:colors.green,letterSpacing:-1.1,marginBottom:12},
  title:{fontSize:30,fontWeight:"900",color:colors.green,letterSpacing:-.9,marginBottom:8},
  paragraph:{fontSize:13,lineHeight:21,color:colors.muted,marginBottom:14},
  searchCard:{backgroundColor:colors.white,padding:18,borderWidth:1,borderColor:colors.border,borderRadius:17,marginTop:10,gap:12},
  fieldLabel:{fontSize:10,fontWeight:"800",color:colors.muted,letterSpacing:.7},
  cityInput:{borderWidth:1,borderColor:colors.border,borderRadius:10,height:47,paddingHorizontal:13,backgroundColor:"#FCFDFB",fontSize:14,color:colors.ink,marginBottom:5},
  filterRow:{flexDirection:"row",flexWrap:"wrap",gap:7},
  filtersScroll:{gap:7,paddingVertical:8},
  filterChip:{minHeight:38,borderRadius:9,borderWidth:1,borderColor:colors.border,backgroundColor:colors.white,paddingHorizontal:11,alignItems:"center",justifyContent:"center"},
  filterChipActive:{backgroundColor:colors.green,borderColor:colors.green},
  filterText:{fontSize:11,fontWeight:"700",color:colors.ink},
  filterActiveText:{color:colors.white},
  primaryButton:{backgroundColor:colors.green,marginTop:5,minHeight:46,borderRadius:11,alignItems:"center",justifyContent:"center",paddingHorizontal:16},
  primaryButtonText:{color:colors.white,fontSize:14,fontWeight:"800"},
  outlineButton:{backgroundColor:colors.white,borderWidth:1,borderColor:colors.border},
  outlineButtonText:{color:colors.green},
  pressed:{opacity:.8},
  sectionTitle:{fontSize:18,fontWeight:"900",color:colors.green,marginTop:26,marginBottom:15},
  infoRow:{flexDirection:"row",alignItems:"center",gap:13,marginBottom:13},
  infoBullet:{fontSize:12,color:colors.sage,fontWeight:"900"},
  infoText:{fontSize:13,color:colors.ink,flex:1},
  textAction:{paddingVertical:12,alignSelf:"flex-start"},inlineLink:{color:colors.green2,fontWeight:"800",fontSize:13},
  searchHead:{backgroundColor:colors.cream,padding:20,paddingBottom:14,gap:6},
  listContent:{padding:18,paddingBottom:35,flexGrow:1},
  rentalCard:{backgroundColor:colors.white,borderRadius:14,padding:15,borderWidth:1,borderColor:colors.border,marginBottom:10,flexDirection:"row",gap:11,alignItems:"center"},
  rentalIcon:{height:66,width:66,borderRadius:12,backgroundColor:colors.soft,alignItems:"center",justifyContent:"center"},
  rentalHouse:{fontSize:36,color:colors.green},
  rentalCopy:{flex:1},rentalType:{fontSize:9,fontWeight:"900",letterSpacing:.8,color:colors.sage,marginBottom:4},
  rentalTitle:{fontSize:14,fontWeight:"800",color:colors.ink,marginBottom:4},
  rentalArea:{fontSize:11,color:colors.muted,marginBottom:7},
  rentalPrice:{fontSize:15,fontWeight:"900",color:colors.green2},
  perMonth:{fontSize:10,fontWeight:"500",color:colors.muted},
  arrow:{fontSize:25,color:colors.sage},emptyCard:{backgroundColor:colors.white,borderRadius:17,padding:24,borderWidth:1,borderColor:colors.border,alignItems:"stretch",marginTop:16,gap:10},
  cardSymbol:{fontSize:32,color:colors.green2,textAlign:"center"},
  cardTitle:{fontSize:19,fontWeight:"900",color:colors.green,textAlign:"center"},
  tabBar:{backgroundColor:colors.white,borderTopWidth:1,borderColor:colors.border,height:64,flexDirection:"row",paddingHorizontal:7},
  tab:{flex:1,alignItems:"center",justifyContent:"center",gap:3,borderRadius:11},
  tabActive:{backgroundColor:colors.soft},tabSymbol:{fontSize:23,color:colors.muted},
  tabLabel:{fontSize:10,color:colors.muted,fontWeight:"800"},tabSelected:{color:colors.green},
  detailHero:{height:175,backgroundColor:colors.soft,borderRadius:18,alignItems:"center",justifyContent:"center",marginVertical:19},
  detailHouse:{fontSize:66,color:colors.green},
  detailPlaceholder:{fontSize:11,color:colors.muted},
  detailPrice:{fontSize:27,fontWeight:"900",color:colors.green,marginVertical:13},
  detailFacts:{flexDirection:"row",gap:15,padding:15,backgroundColor:colors.white,borderRadius:11},
  disclaimer:{color:colors.muted,fontSize:11,lineHeight:17,marginTop:14},
  introPage:{flex:1,backgroundColor:colors.green,paddingHorizontal:24},
  introTop:{flexDirection:"row",alignItems:"center",justifyContent:"space-between",paddingTop:18},
  introSkip:{paddingVertical:12,paddingHorizontal:10},introSkipText:{color:"#E1ECDF",fontSize:13,fontWeight:"800"},
  introCenter:{flex:1,alignItems:"center",justifyContent:"center"},
  introCircle:{height:160,width:160,borderRadius:80,backgroundColor:"#2C634B",alignItems:"center",justifyContent:"center",marginBottom:28,borderWidth:1,borderColor:"#599071"},
  introIllustration:{fontSize:95,color:"#F7F0DF"},
  introStep:{fontSize:10,fontWeight:"900",color:"#D7BC87",letterSpacing:1.8,marginBottom:13},
  introTitle:{fontSize:32,fontWeight:"900",color:colors.white,textAlign:"center",lineHeight:39,letterSpacing:-1},
  introDescription:{fontSize:14,lineHeight:22,color:"#DBE9DD",textAlign:"center",marginTop:17,maxWidth:330},
  dots:{flexDirection:"row",gap:6,marginTop:28},
  dot:{height:7,width:7,borderRadius:7,backgroundColor:"#749A84"},dotActive:{width:24,backgroundColor:colors.gold},
  introBottom:{paddingBottom:22,gap:10},
  introNext:{flexDirection:"row",alignItems:"center",gap:12},
  backButton:{paddingHorizontal:9},backText:{color:colors.white,fontWeight:"700"},
  guestButton:{minHeight:45,alignItems:"center",justifyContent:"center"},
  guestText:{color:"#E6F0E3",fontWeight:"800",fontSize:13},
});
