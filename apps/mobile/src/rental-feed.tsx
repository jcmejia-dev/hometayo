import React,{useCallback,useEffect,useState} from "react";
import {ActivityIndicator,Image,ScrollView,StyleSheet,Text,TextInput,View} from "react-native";
import {FeedbackPressable as Pressable} from "./feedback-pressable";
import {fetchRentals,propertyLabel,rentLabel,type Rental} from "./api";
import {NativeRentalSocial} from "./rental-workspace";
import {Icon} from "./icons";
import {usePalette} from "./theme";
import {VerifiedBadge} from "./verified-badge";

export function RentalFeed({city,onSelect,onInquiry}:{city:string;onSelect:(slug:string)=>void;onInquiry:(id:string)=>void}){
 const c=usePalette();const [query,setQuery]=useState(city||"Koronadal City"),[type,setType]=useState(""),[items,setItems]=useState<Rental[]>([]),[busy,setBusy]=useState(true),[error,setError]=useState("");
 const load=useCallback(async()=>{setBusy(true);setError("");try{setItems(await fetchRentals(query,type));}catch(e){setError(e instanceof Error?e.message:"Could not load rentals.");}finally{setBusy(false);}},[query,type]);
 useEffect(()=>{void load();},[load]);
 return <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={s.body}>
  <Text style={[s.eyebrow,{color:c.sage}]}>EXPLORE RENTALS</Text><Text style={[s.title,{color:c.green}]}>Homes shared by local owners.</Text>
  <View style={[s.search,{backgroundColor:c.white,borderColor:c.border}]}><TextInput value={query} onChangeText={setQuery} placeholder="City or municipality" placeholderTextColor={c.muted} style={[s.input,{color:c.green,borderColor:c.border}]}/><Pressable onPress={()=>void load()} style={[s.searchButton,{backgroundColor:c.green}]}><Icon name="search" color="white"/><Text style={s.searchText}>Search</Text></Pressable></View>
  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.filters}>{["","house","apartment","boarding_house","bedspace"].map(v=><Pressable key={v} onPress={()=>setType(v)} style={[s.chip,{borderColor:c.border,backgroundColor:type===v?c.green:c.white}]}><Text style={{color:type===v?"white":c.green,fontWeight:"700"}}>{v?propertyLabel(v):"All"}</Text></Pressable>)}</ScrollView>
  {busy&&<ActivityIndicator color={c.green} style={{marginTop:30}}/>}{!!error&&<Text style={{color:c.muted}}>{error}</Text>}
  {!busy&&!items.length&&<View style={[s.empty,{backgroundColor:c.white,borderColor:c.border}]}><Text style={[s.cardTitle,{color:c.green}]}>No rentals found</Text><Text style={{color:c.muted}}>Try another city or property type.</Text></View>}
  {items.map(item=><View key={item.slug} style={[s.card,{backgroundColor:c.white,borderColor:c.border}]}>
    <View style={s.ownerRow}>{item.ownerPhoto?<Image source={{uri:item.ownerPhoto}} style={s.avatar}/>:<View style={[s.avatarFallback,{backgroundColor:c.soft}]}><Icon name="user" size={20}/></View>}<View style={{flex:1}}><View style={s.ownerNameRow}><Text style={[s.ownerName,{color:c.green}]}>{item.ownerName||"Property owner"}</Text>{item.ownerVerified&&<VerifiedBadge compact/>}</View><Text style={{color:c.muted,fontSize:11}}>{item.barangay}, {item.city}</Text></View></View>
    {item.photoUrl?<Pressable onPress={()=>onSelect(item.slug)}><Image source={{uri:item.photoUrl}} style={s.photo} resizeMode="cover"/></Pressable>:<Pressable onPress={()=>onSelect(item.slug)} style={[s.placeholder,{backgroundColor:c.soft}]}><Icon name="building" size={48}/><Text style={{color:c.muted}}>No property photo yet</Text></Pressable>}
    <Pressable onPress={()=>onSelect(item.slug)}><Text style={[s.cardTitle,{color:c.green}]}>{item.title}</Text><Text style={[s.price,{color:c.green}]}>{rentLabel(item.monthlyRentCentavos)} <Text style={{fontSize:12,fontWeight:"500"}}>/ month</Text></Text><Text style={{color:c.muted,lineHeight:19}} numberOfLines={3}>{item.description}</Text></Pressable>
    <View style={s.facts}><Text style={{color:c.green}}>{item.bedrooms??"—"} bed</Text><Text style={{color:c.green}}>{item.bathrooms??"—"} bath</Text>{item.unitCounts&&<Text style={{color:c.green}}>{item.unitCounts.available} available</Text>}</View>
    <NativeRentalSocial slug={item.slug} onInquiry={onInquiry}/>
  </View>)}
 </ScrollView>;
}
const s=StyleSheet.create({body:{padding:18,paddingBottom:42,gap:14},eyebrow:{fontSize:10,fontWeight:"800",letterSpacing:1.5},title:{fontSize:29,fontWeight:"900",lineHeight:34},search:{borderWidth:1,borderRadius:18,padding:10,gap:9},input:{borderWidth:1,borderRadius:12,paddingHorizontal:12,height:44},searchButton:{height:44,borderRadius:12,alignItems:"center",justifyContent:"center",flexDirection:"row",gap:8},searchText:{color:"white",fontWeight:"800"},filters:{gap:8,paddingVertical:2},chip:{borderWidth:1,borderRadius:999,paddingHorizontal:14,paddingVertical:9},card:{borderWidth:1,borderRadius:22,padding:14,gap:12},ownerRow:{flexDirection:"row",alignItems:"center",gap:10},ownerNameRow:{flexDirection:"row",alignItems:"center",gap:6,flexWrap:"wrap"},avatar:{width:42,height:42,borderRadius:21},avatarFallback:{width:42,height:42,borderRadius:21,alignItems:"center",justifyContent:"center"},ownerName:{fontWeight:"800"},photo:{height:230,width:"100%",borderRadius:16},placeholder:{height:180,borderRadius:16,alignItems:"center",justifyContent:"center",gap:8},cardTitle:{fontSize:18,fontWeight:"900",marginBottom:4},price:{fontSize:20,fontWeight:"900",marginBottom:5},facts:{flexDirection:"row",gap:12,flexWrap:"wrap"},empty:{padding:24,borderRadius:18,borderWidth:1}});
