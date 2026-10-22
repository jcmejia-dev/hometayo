import React,{useEffect,useMemo,useState} from "react";
import {ActivityIndicator,Animated,AppState,BackHandler,Image,ScrollView,StatusBar,StyleSheet,Text,View} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {SafeAreaProvider,SafeAreaView} from "react-native-safe-area-context";
import {FeedbackPressable as Pressable} from "./src/feedback-pressable";
import {BrandMark} from "./src/brand-mark";
import {usePalette,useTheme,ThemeProvider} from "./src/theme";
import {Icon,type IconName} from "./src/icons";
import {colors} from "./src/design";
import {NativeWelcome} from "./src/welcome";
import {restoreAccount,watchSessionExpired,type Account} from "./src/session";
import {AccountPanel} from "./src/account-panel";
import {OwnerStudio} from "./src/owner-studio";
import {NativeRentalSocial} from "./src/rental-workspace";
import {MessengerWorkspace} from "./src/messenger-workspace";
import {RentalCenter} from "./src/rental-center-shell";
import {RentalFeed} from "./src/rental-feed";
import {fetchRentalDetail,priceLabel,propertyLabel,type RentalDetail} from "./src/api";
import {useReducedMotion,useSceneTransition} from "./src/motion";
import {api} from "./src/session";
import {listenForNotificationResponses,registerPushNotifications} from "./src/push-notifications";
import {checkForAppUpdate,notifyForAppUpdate,openAppUpdate,type AppUpdateInfo} from "./src/app-update";

type Tab="home"|"explore"|"messages"|"rental"|"owner"|"profile";
const INTRO_KEY="hometayo.native.intro.v1";
const renterTabs:Array<{id:Tab;label:string;symbol:IconName}>=[{id:"home",label:"Home",symbol:"home"},{id:"explore",label:"Marketplace",symbol:"search"},{id:"rental",label:"My rental",symbol:"key"},{id:"messages",label:"Messages",symbol:"message"},{id:"profile",label:"Account",symbol:"user"}];
const ownerTabs:Array<{id:Tab;label:string;symbol:IconName}>=[{id:"owner",label:"Dashboard",symbol:"building"},{id:"rental",label:"Rental",symbol:"key"},{id:"messages",label:"Messages",symbol:"message"},{id:"profile",label:"Profile",symbol:"user"}];

function Brand(){return <View style={s.brand}><BrandMark/><Text style={s.brandWord}>Home<Text style={{color:colors.gold}}>Tayo</Text></Text></View>;}
function BigButton({label,onPress,secondary=false}:{label:string;onPress:()=>void;secondary?:boolean}){const c=usePalette();return <Pressable onPress={onPress} style={[s.bigButton,{backgroundColor:secondary?c.white:c.green,borderColor:c.border}]}><Text style={{color:secondary?c.green:"white",fontWeight:"900"}}>{label}</Text><Icon name="arrow" color={secondary?c.green:"white"}/></Pressable>;}

function NativeApp(){
 const c=usePalette(),{theme}=useTheme();
 const [ready,setReady]=useState(false),[account,setAccount]=useState<Account|null>(null),[welcomeOpen,setWelcomeOpen]=useState(true),[intro,setIntro]=useState<number|null>(null),[tab,setTab]=useState<Tab>("home"),[city,setCity]=useState("Koronadal City"),[selectedSlug,setSelectedSlug]=useState<string|null>(null),[selected,setSelected]=useState<RentalDetail|null>(null),[detailBusy,setDetailBusy]=useState(false),[inboxConversation,setInboxConversation]=useState<string|undefined>(),[rentalConversation,setRentalConversation]=useState<string|undefined>(),[appUpdate,setAppUpdate]=useState<AppUpdateInfo|null>(null);
 const reduced=useReducedMotion(),transition=useSceneTransition(tab+":"+(selectedSlug||""),reduced);
 const tabs=useMemo(()=>account?.role==="landlord"?ownerTabs:renterTabs,[account?.role]);
 useEffect(()=>watchSessionExpired(()=>{setAccount(null);setWelcomeOpen(true);setTab("home");}),[]);
 useEffect(()=>{let alive=true;Promise.all([AsyncStorage.getItem(INTRO_KEY),restoreAccount().catch(()=>null)]).then(([value,saved])=>{if(!alive)return;setAccount(saved);if(saved){setWelcomeOpen(false);setTab(saved.role==="landlord"?"owner":"home");}setIntro(value==="done"?null:0);setReady(true);}).catch(()=>{if(alive){setIntro(0);setReady(true);}});return()=>{alive=false;};},[]);
 useEffect(()=>{let alive=true;const check=()=>{void checkForAppUpdate().then(update=>{if(!alive)return;setAppUpdate(update);if(update)void notifyForAppUpdate(update).catch(()=>{});}).catch(()=>{});};check();const sub=AppState.addEventListener("change",state=>{if(state==="active")check();});return()=>{alive=false;sub.remove();};},[]);
 useEffect(()=>{if(!account)return;void registerPushNotifications().catch(()=>{});},[account?.id]);
 useEffect(()=>listenForNotificationResponses(conversationId=>{setInboxConversation(conversationId);setSelectedSlug(null);setWelcomeOpen(false);setTab("messages");},conversationId=>{setRentalConversation(conversationId);setSelectedSlug(null);setWelcomeOpen(false);setTab("rental");}),[]);
 useEffect(()=>{if(!account||account.role==="landlord")return;let live=true;api("/api/mobile/profile").then(v=>{if(live&&v.profile?.homeCity)setCity(v.profile.homeCity);}).catch(()=>{});return()=>{live=false;};},[account]);
 useEffect(()=>{if(!selectedSlug){setSelected(null);return;}let live=true;const ctrl=new AbortController();setDetailBusy(true);fetchRentalDetail(selectedSlug,ctrl.signal).then(v=>{if(live)setSelected(v);}).catch(()=>{if(live)setSelectedSlug(null);}).finally(()=>{if(live)setDetailBusy(false);});return()=>{live=false;ctrl.abort();};},[selectedSlug]);
 useEffect(()=>{const sub=BackHandler.addEventListener("hardwareBackPress",()=>{if(selectedSlug){setSelectedSlug(null);return true;}if(account?.role==="landlord"&&tab!=="owner"){setTab("owner");return true;}if(account?.role!=="landlord"&&tab!=="home"){setTab("home");return true;}return false;});return()=>sub.remove();},[selectedSlug,tab,account?.role]);
 function finish(user?:Account|null){void AsyncStorage.setItem(INTRO_KEY,"done").catch(()=>{});setIntro(null);setWelcomeOpen(false);if(user){setAccount(user);setTab(user.role==="landlord"?"owner":"home");}else setTab("home");}
 if(!ready)return <SafeAreaView style={[s.container,{backgroundColor:theme.background}]}><ActivityIndicator color={c.green} style={{marginTop:80}}/></SafeAreaView>;
 if(welcomeOpen)return <NativeWelcome returning={intro===null} onGuest={()=>finish(null)} onSignedIn={user=>finish(user)}/>;
 return <SafeAreaView style={[s.container,{backgroundColor:theme.background}]}><StatusBar barStyle="dark-content" backgroundColor={theme.background}/><View style={[s.header,{backgroundColor:c.white,borderColor:c.border}]}><Brand/><Text style={[s.headerTag,{color:c.sage}]}>{account?.role==="landlord"?"OWNER":"RENTER"}</Text></View>{appUpdate&&<Pressable onPress={()=>void openAppUpdate(appUpdate.downloadUrl)} style={[s.updateBanner,{backgroundColor:c.green}]}><View style={{flex:1}}><Text style={s.updateTitle}>New HomeTayo update available</Text><Text style={s.updateCopy}>A newer app build is ready. Tap to download the latest APK.</Text></View><Icon name="arrow" color="white"/></Pressable>}<Animated.View style={[{flex:1},transition.style]}>
 {selectedSlug?<ScrollView contentContainerStyle={s.detailBody}>
  <Pressable onPress={()=>setSelectedSlug(null)} style={s.back}><Icon name="back"/><Text style={{color:c.green,fontWeight:"800"}}>Back to marketplace</Text></Pressable>
  {detailBusy?<ActivityIndicator color={c.green} style={{marginTop:60}}/>:selected?<>
   <View style={s.detailBadges}><Text style={[s.marketBadge,{backgroundColor:selected.listingPurpose==="sale"?"#FFF4D7":c.soft,color:c.green}]}>{selected.listingPurpose==="sale"?"FOR SALE":"FOR RENT"}</Text><Text style={[s.eyebrow,{color:c.sage}]}>{propertyLabel(selected.propertyType).toUpperCase()}</Text></View><Text style={[s.title,{color:c.green}]}>{selected.title}</Text><Text style={{color:c.muted}}>{selected.barangay}, {selected.city}, {selected.province}</Text>
   <View style={[s.ownerCard,{backgroundColor:c.white,borderColor:c.border}]}>{selected.ownerPhoto?<Image source={{uri:selected.ownerPhoto}} style={s.ownerAvatar}/>:<View style={[s.ownerAvatarFallback,{backgroundColor:c.soft}]}><Icon name="user"/></View>}<View style={{flex:1}}><Text style={{color:c.green,fontWeight:"900"}}>{selected.ownerName||"Property owner"}</Text><Text style={{color:c.muted,fontSize:12}}>{selected.listingPurpose==="sale"?"Property seller":"Property owner"}</Text></View></View>
   {selected.photoUrls?.length?selected.photoUrls.map((uri,i)=><Image key={uri+i} source={{uri}} style={s.detailPhoto} resizeMode="cover"/>):<View style={[s.noPhoto,{backgroundColor:c.soft}]}><Icon name="building" size={55}/><Text style={{color:c.muted}}>No property photos yet</Text></View>}
   <Text style={[s.price,{color:c.green}]}>{priceLabel(selected)}</Text><Text style={{color:c.muted,lineHeight:21}}>{selected.description}</Text>
   <View style={s.facts}><Text style={{color:c.green}}>{selected.bedrooms??"—"} bedrooms</Text><Text style={{color:c.green}}>{selected.bathrooms??"—"} bathrooms</Text><Text style={{color:c.green}}>{selected.furnished}</Text></View>
   <NativeRentalSocial slug={selected.slug} onInquiry={id=>{setInboxConversation(id);setSelectedSlug(null);setTab("messages");}}/>
   {selected.listingPurpose==="rent"&&!!selected.units?.length&&<View style={{gap:8}}><Text style={[s.section,{color:c.green}]}>Rooms & availability</Text>{selected.units.map(u=><View key={u.id} style={[s.unit,{backgroundColor:c.white,borderColor:c.border}]}><Text style={{color:c.green,fontWeight:"800"}}>{u.label}</Text><Text style={{color:c.muted}}>{u.status} · ₱{Math.round(u.monthlyRentCentavos/100).toLocaleString("en-PH")}/month</Text></View>)}</View>}
   <Text style={[s.disclaimer,{color:c.muted}]}>Verify the property, owner or seller, legal documents, condition, and payment instructions independently before sending money.</Text>
  </>:null}
 </ScrollView>:
 tab==="explore"?<RentalFeed city={city} onSelect={setSelectedSlug} onInquiry={id=>{setInboxConversation(id);setTab("messages");}}/>:
 tab==="rental"?(account?<RentalCenter owner={account.role==="landlord"} initialConversation={rentalConversation} onMessages={id=>{setInboxConversation(id);setTab("messages");}}/>:<AccountPanel account={null} owner={false} onAccountChange={setAccount} onLogin={()=>setWelcomeOpen(true)}/>):
 tab==="messages"?(account?<MessengerWorkspace owner={account.role==="landlord"} initialConversation={inboxConversation}/>:<AccountPanel account={null} owner={false} onAccountChange={setAccount} onLogin={()=>setWelcomeOpen(true)}/> ):
 tab==="owner"&&account?.role==="landlord"?<OwnerStudio account={account} onMessages={()=>setTab("messages")} onRental={()=>setTab("rental")}/>:
 tab==="profile"?<AccountPanel account={account} owner={false} onAccountChange={setAccount} onLogin={()=>setWelcomeOpen(true)}/>:
 <ScrollView contentContainerStyle={s.homeBody}>
  <Text style={[s.eyebrow,{color:c.sage}]}>RENTER WORKSPACE</Text><Text style={[s.hero,{color:c.green}]}>Find a place <Text style={{color:c.sage}}>worth calling home.</Text></Text><Text style={{color:c.muted,lineHeight:22}}>Scroll through local property posts, discover homes for rent or sale, and message owners directly.</Text>
  <View style={[s.heroCard,{backgroundColor:c.soft}]}><View style={{flex:1}}><Text style={[s.section,{color:c.green}]}>Property feed</Text><Text style={{color:c.muted,lineHeight:19}}>A social-style marketplace with owner profiles, photos, reactions, rentals, and homes for sale.</Text></View><Icon name="building" size={46}/></View>
  <BigButton label="Open marketplace" onPress={()=>setTab("explore")}/>{account&&<><BigButton secondary label="Open my rental" onPress={()=>setTab("rental")}/><BigButton secondary label="Open messages" onPress={()=>setTab("messages")}/></>}<View style={[s.safety,{backgroundColor:c.white,borderColor:c.border}]}><Icon name="shield"/><View style={{flex:1}}><Text style={{color:c.green,fontWeight:"900"}}>Marketplace safety</Text><Text style={{color:c.muted,lineHeight:18}}>Inspect properties, verify ownership and documents, and never send money until the transaction is independently confirmed.</Text></View></View>
 </ScrollView>}
 </Animated.View><View style={[s.tabBar,{backgroundColor:c.white,borderColor:c.border}]}>{tabs.map(t=>{const active=tab===t.id;return <Pressable key={t.id} onPress={()=>transition.change(()=>{setSelectedSlug(null);setTab(t.id);},true)} style={s.tab}><View style={[s.tabIcon,active&&{backgroundColor:c.soft}]}><Icon name={t.symbol} size={21} color={active?c.green:c.muted}/></View><Text style={{color:active?c.green:c.muted,fontSize:10,fontWeight:active?"900":"700"}}>{t.label}</Text></Pressable>;})}</View></SafeAreaView>;
}
export default function App(){return <SafeAreaProvider><ThemeProvider><NativeApp/></ThemeProvider></SafeAreaProvider>;}

const s=StyleSheet.create({container:{flex:1},header:{height:62,borderBottomWidth:1,paddingHorizontal:18,flexDirection:"row",alignItems:"center",justifyContent:"space-between"},brand:{flexDirection:"row",alignItems:"center",gap:8},brandWord:{fontSize:21,fontWeight:"900",color:colors.green},headerTag:{fontSize:10,fontWeight:"900",letterSpacing:1.5},updateBanner:{minHeight:62,paddingHorizontal:16,paddingVertical:10,flexDirection:"row",alignItems:"center",gap:12},updateTitle:{color:"white",fontSize:14,fontWeight:"900"},updateCopy:{color:"white",fontSize:11,lineHeight:16,opacity:.9,marginTop:2},homeBody:{padding:22,paddingBottom:45,gap:16},eyebrow:{fontSize:10,fontWeight:"900",letterSpacing:1.5},hero:{fontSize:36,lineHeight:42,fontWeight:"900",letterSpacing:-1.1},heroCard:{borderRadius:24,padding:20,flexDirection:"row",alignItems:"center",gap:15},section:{fontSize:19,fontWeight:"900"},bigButton:{minHeight:56,borderWidth:1,borderRadius:16,paddingHorizontal:16,alignItems:"center",justifyContent:"space-between",flexDirection:"row"},safety:{borderWidth:1,borderRadius:18,padding:16,flexDirection:"row",gap:12,alignItems:"center"},detailBody:{padding:20,paddingBottom:48,gap:14},back:{flexDirection:"row",alignItems:"center",gap:8},detailBadges:{flexDirection:"row",alignItems:"center",gap:8},marketBadge:{fontSize:10,fontWeight:"900",paddingHorizontal:9,paddingVertical:5,borderRadius:999,overflow:"hidden"},title:{fontSize:31,fontWeight:"900",lineHeight:36},ownerCard:{borderWidth:1,borderRadius:18,padding:12,flexDirection:"row",alignItems:"center",gap:10},ownerAvatar:{width:46,height:46,borderRadius:23},ownerAvatarFallback:{width:46,height:46,borderRadius:23,alignItems:"center",justifyContent:"center"},detailPhoto:{width:"100%",height:260,borderRadius:20},noPhoto:{height:190,borderRadius:20,alignItems:"center",justifyContent:"center",gap:8},price:{fontSize:26,fontWeight:"900"},facts:{flexDirection:"row",gap:12,flexWrap:"wrap"},unit:{borderWidth:1,borderRadius:14,padding:12,gap:3},disclaimer:{fontSize:11,lineHeight:18},tabBar:{height:68,borderTopWidth:1,flexDirection:"row",paddingHorizontal:6,paddingTop:4},tab:{flex:1,alignItems:"center",justifyContent:"center",gap:2},tabIcon:{width:40,height:31,borderRadius:15,alignItems:"center",justifyContent:"center"}});