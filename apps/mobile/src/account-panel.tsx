import {OwnerUnits} from "./owner-units";
import {NativeRentalWorkspace} from "./rental-workspace";
import {FeedbackPressable as Pressable} from "./feedback-pressable";
import {usePalette,useThemedStyles} from "./theme";
import {ProfileSettings} from "./profile-settings";
import {useTheme} from "./theme";
import React,{useEffect,useState} from "react";
import {ScrollView,Text,TextInput,View,StyleSheet} from "react-native";
import MapView,{Marker,PROVIDER_GOOGLE} from "react-native-maps";
import {mapsAvailable} from "./runtime";
import {api,logOut,type Account} from "./session";
import {Icon} from "./icons";
import {colors} from "./design";
import {UpdateButton} from "./update-button";

export function AccountPanel({account,owner,onAccountChange,onLogin,initialConversation}: {account:Account|null;owner:boolean;onAccountChange:(account:Account|null)=>void;onLogin:()=>void;initialConversation?:string}) {
  const colors=usePalette(); const s=useThemedStyles(baseStyles);

  const {theme}=useTheme();
  const [owned,setOwned]=useState<Array<{id:string;title:string;status:string;latitude:number|null;longitude:number|null}>>([]),[message,setMessage]=useState(""),[busy,setBusy]=useState(false);
  const [fields,setFields]=useState({title:"",description:"",city:"",province:"",barangay:"",monthlyRent:"",latitude:"",longitude:""});
  const [propertyType,setPropertyType]=useState("house");
  const [unitsId,setUnitsId]=useState<string|null>(null);
  const [workspace,setWorkspace]=useState(false);
  useEffect(()=>{if(initialConversation)setWorkspace(true);},[initialConversation]);
  const [editingId,setEditingId]=useState<string|null>(null);
  async function load() {try {setOwned((await api("/api/mobile/listings")).listings);}catch(e){setMessage(e instanceof Error?e.message:"Could not load listings.");}}
  useEffect(()=>{if(account&&owner)void load();},[account,owner]);
  async function submit() {
    if(editingId&&(!fields.latitude.trim()||!fields.longitude.trim())){setMessage("Choose a property map pin before saving.");return;}
    setBusy(true);setMessage("");
    try {const data=editingId?await api("/api/mobile/listings",{id:editingId,latitude:Number(fields.latitude),longitude:Number(fields.longitude)},"PATCH"):await api("/api/mobile/listings",{...fields,propertyType,rentalMode:propertyType==="bedspace"?"per_bed":"whole_unit",bedrooms:"",bathrooms:"",availableSlots:"",furnished:"unspecified",ownerContactKind:"none",ownerContactValue:""});setMessage(data.message);await load();}
    catch(e){setMessage(e instanceof Error?e.message:"Submission failed.");}finally{setBusy(false);}
  }
  if(workspace&&account)return <NativeRentalWorkspace key={account.id} owner={account.role==="landlord"} initialConversation={initialConversation} onClose={()=>setWorkspace(false)}/>;
  return <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={s.body}>
    <View style={s.profileIcon}><Icon name={owner?"building":"user"} size={34}/></View><Text style={s.eyebrow}>{owner?"PROPERTY OWNER":"HOMETAYO ACCOUNT"}</Text>
    <Text style={s.title}>{owner?"Your rental listings":"Your account"}</Text>
    {!account?<><Text style={s.note}>Sign in inside HomeTayo to manage your account and rental listings.</Text><Pressable accessibilityRole="button" onPress={onLogin} style={[s.button,{backgroundColor:theme.accent}]}><Text style={s.buttonText}>Sign in or create account</Text><Icon name="arrow" color="white" size={18}/></Pressable></>:<>
      <Text style={s.note}>{account.displayName||account.email} · {account.role==="landlord"?"Property owner":account.role}</Text>
      <Pressable accessibilityRole="button" onPress={()=>setWorkspace(true)} style={[s.button,{backgroundColor:theme.accent}]}><Icon name="mail" color="white" size={20}/><Text style={s.buttonText}>{account.role==="landlord"?"Dashboard, messages & payments":"Messages, notifications & tenancy"}</Text></Pressable>
      {!owner?<>
      <ProfileSettings account={account} onAccountChange={onAccountChange}/>
      <Pressable accessibilityRole="button" onPress={()=>{void logOut().then(()=>onAccountChange(null)).catch(()=>setMessage("Could not revoke your session. Check your connection and retry."));}} style={[s.button,{backgroundColor:theme.accent}]}><Icon name="logout" color="white" size={20}/><Text style={s.buttonText}>Sign out</Text></Pressable></>:<>
        {owned.map(item=><View key={item.id} style={s.card}><Text style={s.bold}>{item.title}</Text><Text style={s.note}>{item.status.replaceAll("_"," ")}</Text><Pressable accessibilityRole="button" onPress={()=>{setEditingId(item.id);setFields(old=>({...old,latitude:item.latitude===null?"":String(item.latitude),longitude:item.longitude===null?"":String(item.longitude)}));setMessage("Choose this property’s pin below. Changing a live pin sends the rental back for review.");}}><Text style={s.bold}>Set / update map pin</Text></Pressable><Pressable accessibilityRole="button" onPress={()=>setUnitsId(unitsId===item.id?null:item.id)}><Text style={s.bold}>{unitsId===item.id?"Close room manager":"Manage rooms & availability"}</Text></Pressable>{unitsId===item.id&&<OwnerUnits listingId={item.id}/>}</View>)}
        <Text style={s.bold}>{editingId?"Update property map pin":"Submit a rental"}</Text><Text style={s.note}>Only submit a property you own or have permission to advertise. It stays private until approved.</Text>
        {Object.entries(fields).filter(([key])=>!editingId||["latitude","longitude"].includes(key)).map(([key,value])=><View key={key}><Text style={s.label}>{({title:"Rental title",description:"Description (at least 30 characters)",city:"City / municipality",province:"Province",barangay:"Barangay",monthlyRent:"Monthly rent (₱)",latitude:"Property latitude (optional)",longitude:"Property longitude (optional)"} as Record<string,string>)[key]}</Text><TextInput accessibilityLabel={key} value={value} onChangeText={v=>setFields(old=>({...old,[key]:v}))} multiline={key==="description"} keyboardType={["monthlyRent","latitude","longitude"].includes(key)?"numbers-and-punctuation":"default"} style={s.input}/></View>)}
        <View style={s.row}>{["house","apartment","boarding_house","bedspace"].map(type=><Pressable accessibilityRole="radio" accessibilityState={{checked:type===propertyType}} key={type} onPress={()=>setPropertyType(type)} style={[s.chip,type===propertyType&&{backgroundColor:colors.border}]}><Text>{type.replaceAll("_"," ")}</Text></Pressable>)}</View>
        {mapsAvailable&&<><Text style={s.note}>Long-press the map to mark the property. Publishing these coordinates lets renters see its location.</Text><MapView provider={PROVIDER_GOOGLE} style={{height:250}} initialRegion={{latitude:12.88,longitude:121.77,latitudeDelta:15,longitudeDelta:15}} onLongPress={e=>setFields(old=>({...old,latitude:String(e.nativeEvent.coordinate.latitude),longitude:String(e.nativeEvent.coordinate.longitude)}))}>{fields.latitude&&fields.longitude&&Number.isFinite(Number(fields.latitude))&&Number.isFinite(Number(fields.longitude))&&Math.abs(Number(fields.latitude))<=90&&Math.abs(Number(fields.longitude))<=180?<Marker coordinate={{latitude:Number(fields.latitude),longitude:Number(fields.longitude)}}/>:null}</MapView></>}
        <Pressable accessibilityRole="button" disabled={busy} onPress={()=>void submit()} style={[s.button,{backgroundColor:theme.accent}]}><Text style={s.buttonText}>{busy?"Submitting…":editingId?"Save map pin for review":"Submit for review"}</Text></Pressable>
        {editingId&&<Pressable accessibilityRole="button" onPress={()=>setEditingId(null)}><Text style={s.bold}>Cancel pin update / add a new rental</Text></Pressable>}
      </>}
    </>}
    {message?<Text accessibilityRole="alert" style={s.note}>{message}</Text>:null}
    <UpdateButton/>
  </ScrollView>;
}
const baseStyles=StyleSheet.create({profileIcon:{height:76,width:76,borderRadius:26,backgroundColor:colors.soft,alignItems:"center",justifyContent:"center",marginBottom:8},eyebrow:{fontSize:10,letterSpacing:1.4,color:colors.sage,fontWeight:"800"},body:{padding:24,paddingBottom:40,gap:14},title:{fontSize:29,fontWeight:"800",color:colors.green},note:{fontSize:13,color:colors.muted,lineHeight:21},bold:{fontSize:17,fontWeight:"800",color:colors.green},card:{backgroundColor:"white",padding:18,borderRadius:22,gap:8,borderWidth:1,borderColor:colors.border},button:{backgroundColor:colors.green,borderRadius:16,padding:16,alignItems:"center",justifyContent:"center",flexDirection:"row",gap:10,minHeight:54},buttonText:{color:"white",fontWeight:"800"},label:{fontSize:12,color:colors.green,marginBottom:8},input:{backgroundColor:"white",borderRadius:10,borderWidth:1,borderColor:colors.border,padding:13},row:{flexDirection:"row",gap:8,flexWrap:"wrap"},chip:{padding:12,borderRadius:8,backgroundColor:"white"}});
