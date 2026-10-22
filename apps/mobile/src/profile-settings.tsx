import React,{useEffect,useState} from "react";
import {ActivityIndicator,StyleSheet,Text,TextInput,View} from "react-native";
import {FeedbackPressable as Pressable} from "./feedback-pressable";
import {Avatar,avatarOptions,defaultAvatar,normalizeAvatar,randomAvatar,type AvatarConfig} from "./avatar";
import {api,type Account} from "./session";
import {themes,usePalette,useTheme} from "./theme";
import {colors} from "./design";

const empty={preferredName:"",homeCity:"",preferredPropertyType:"",preferredBudgetPesos:""};
const hairLabels:Record<string,string>={crop:"Crop",waves:"Waves",bun:"Bun",spikes:"Spikes",curly:"Curly"};
const expressionLabels:Record<string,string>={smile:"Smile",happy:"Happy",wink:"Wink",cool:"Cool"};

export function ProfileSettings({account,onAccountChange}:{account:Account;onAccountChange:(account:Account)=>void}){
 const c=usePalette();const {theme,setTheme}=useTheme();
 const [fields,setFields]=useState(empty),[avatar,setAvatar]=useState<AvatarConfig>(defaultAvatar),[loading,setLoading]=useState(true),[busy,setBusy]=useState(false),[message,setMessage]=useState("");
 const [revision,reload]=useState(0);
 useEffect(()=>{let active=true;setLoading(true);setMessage("");api("/api/mobile/profile").then(data=>{if(active){const p=data.profile||{};setFields({preferredName:p.preferredName||"",homeCity:p.homeCity||"",preferredPropertyType:p.preferredPropertyType||"",preferredBudgetPesos:p.preferredBudgetPesos==null?"":String(p.preferredBudgetPesos)});setAvatar(normalizeAvatar(p.avatarConfig));setLoading(false);}}).catch(e=>{if(active){setMessage(e.message);setLoading(false);}});return()=>{active=false;};},[account.id,revision]);
 async function save(){if(busy)return;setBusy(true);setMessage("");try{const data=await api("/api/mobile/profile",{...fields,avatarConfig:avatar},"PATCH");onAccountChange(data.account);setMessage("Profile, avatar and rental preferences saved.");}catch(e){setMessage(e instanceof Error?e.message:"Could not save. Try again.");}finally{setBusy(false);}}
 const choose=(key:keyof AvatarConfig,value:string)=>setAvatar(old=>({...old,[key]:value}));
 return <View style={s.stack}>
  <View style={[s.card,{backgroundColor:c.white,borderColor:c.border}]}>
   <Text style={[s.title,{color:theme.accent}]}>Your HomeTayo avatar</Text>
   <Text style={[s.note,{color:c.muted}]}>Make a little character that feels like you. You can change it anytime.</Text>
   <View style={s.avatarHero}><View style={[s.avatarFrame,{borderColor:theme.accent}]}><Avatar config={avatar} size={126}/></View><Pressable accessibilityRole="button" onPress={()=>setAvatar(randomAvatar())} style={[s.random,{backgroundColor:theme.soft,borderColor:theme.accent}]}><Text style={[s.randomText,{color:theme.accent}]}>🎲 Randomize</Text></Pressable></View>
   <OptionRow label="Skin tone" values={avatarOptions.skin} selected={avatar.skin} onPick={v=>choose("skin",v)} colorsOnly/>
   <OptionRow label="Hair style" values={avatarOptions.hair} selected={avatar.hair} onPick={v=>choose("hair",v)} labels={hairLabels}/>
   <OptionRow label="Hair color" values={avatarOptions.hairColor} selected={avatar.hairColor} onPick={v=>choose("hairColor",v)} colorsOnly/>
   <OptionRow label="Shirt" values={avatarOptions.outfit} selected={avatar.outfit} onPick={v=>choose("outfit",v)} colorsOnly/>
   <OptionRow label="Background" values={avatarOptions.background} selected={avatar.background} onPick={v=>choose("background",v)} colorsOnly/>
   <OptionRow label="Expression" values={avatarOptions.expression} selected={avatar.expression} onPick={v=>choose("expression",v)} labels={expressionLabels}/>
  </View>
  <View style={[s.card,{backgroundColor:c.white,borderColor:c.border}]}><Text style={[s.title,{color:theme.accent}]}>Make it yours</Text><Text style={[s.note,{color:c.muted}]}>Accent color · saved on this phone</Text><View style={s.row}>{themes.map(t=><Pressable key={t.id} accessibilityRole="button" accessibilityState={{selected:theme.id===t.id}} onPress={()=>void setTheme(t.id).catch(()=>setMessage("Could not save this theme. Try again."))} style={[s.chip,{borderColor:theme.id===t.id?t.accent:c.border}]}><View style={{height:20,width:20,borderRadius:10,backgroundColor:t.accent}}/><Text style={[s.label,{color:c.ink}]}>{t.name}</Text></Pressable>)}</View></View>
  <View style={[s.card,{backgroundColor:c.white,borderColor:c.border}]}><Text style={[s.title,{color:theme.accent}]}>Personal settings</Text><Text style={[s.note,{color:c.muted}]}>Your avatar, name and rental preferences sync with your HomeTayo account.</Text>{loading?<>{message?<Pressable onPress={()=>reload(v=>v+1)} accessibilityRole="button"><Text style={[s.label,{color:c.ink}]}>Retry loading settings</Text></Pressable>:<ActivityIndicator color={theme.accent}/>}</>:<>
   {([['preferredName','Display name','What should we call you?'],['homeCity','Preferred location','e.g. Koronadal City'],['preferredBudgetPesos','Maximum rent per month (PHP)','Optional']] as const).map(([key,label,placeholder])=><View key={key} style={s.field}><Text style={[s.label,{color:c.ink}]}>{label}</Text><TextInput accessibilityLabel={label} style={[s.input,{borderColor:c.border,color:c.ink}]} value={fields[key]} onChangeText={value=>setFields(old=>({...old,[key]:value}))} placeholder={placeholder} placeholderTextColor={c.muted} maxLength={key==="preferredBudgetPesos"?7:80} keyboardType={key==="preferredBudgetPesos"?"number-pad":"default"}/></View>)}
   <Text style={[s.label,{color:c.ink}]}>Preferred property type</Text><View style={s.row}>{[['','Any'],['house','House'],['apartment','Apartment'],['boarding_house','Boarding house'],['bedspace','Bedspace']].map(([value,label])=><Pressable key={value} accessibilityRole="radio" accessibilityState={{checked:fields.preferredPropertyType===value}} onPress={()=>setFields(old=>({...old,preferredPropertyType:value}))} style={[s.chip,{borderColor:fields.preferredPropertyType===value?theme.accent:c.border,backgroundColor:fields.preferredPropertyType===value?theme.soft:c.white}]}><Text style={[s.label,{color:c.ink}]}>{label}</Text></Pressable>)}</View>
   <Pressable accessibilityRole="button" disabled={busy} onPress={()=>void save()} style={[s.save,{backgroundColor:theme.accent,opacity:busy?.6:1}]}>{busy?<ActivityIndicator color="white"/>:<Text style={s.saveText}>Save profile & avatar</Text>}</Pressable></>}</View>{message?<Text accessibilityRole="alert" style={[s.note,{color:c.muted}]}>{message}</Text>:null}
 </View>;
}

function OptionRow({label,values,selected,onPick,colorsOnly=false,labels}:{label:string;values:readonly string[];selected:string;onPick:(value:string)=>void;colorsOnly?:boolean;labels?:Record<string,string>}){
 const c=usePalette();const {theme}=useTheme();
 return <View style={s.optionGroup}><Text style={[s.label,{color:c.ink}]}>{label}</Text><View style={s.row}>{values.map(value=><Pressable key={value} accessibilityRole="button" accessibilityState={{selected:selected===value}} accessibilityLabel={`${label}: ${labels?.[value]||value}`} onPress={()=>onPick(value)} style={[colorsOnly?s.colorChoice:s.choice,{borderColor:selected===value?theme.accent:c.border,backgroundColor:colorsOnly?value:selected===value?theme.soft:c.white}]}>{colorsOnly?(selected===value?<Text style={s.check}>✓</Text>:null):<Text style={[s.choiceText,{color:c.ink}]}>{labels?.[value]||value}</Text>}</Pressable>)}</View></View>;
}

const s=StyleSheet.create({stack:{gap:16},card:{padding:20,borderRadius:22,gap:14,borderWidth:1},title:{fontSize:20,fontWeight:"800"},note:{fontSize:12,lineHeight:20},label:{fontSize:12,fontWeight:"700"},row:{flexDirection:"row",flexWrap:"wrap",gap:10},chip:{minHeight:46,paddingHorizontal:12,paddingVertical:10,borderRadius:14,borderWidth:1,flexDirection:"row",alignItems:"center",gap:8},field:{gap:8},input:{padding:14,borderRadius:12,borderWidth:1,fontSize:14},save:{minHeight:50,borderRadius:14,alignItems:"center",justifyContent:"center"},saveText:{color:"white",fontWeight:"800"},avatarHero:{alignItems:"center",gap:10,paddingVertical:4},avatarFrame:{borderRadius:68,borderWidth:4,overflow:"hidden"},random:{minHeight:42,paddingHorizontal:16,borderRadius:999,borderWidth:1,alignItems:"center",justifyContent:"center"},randomText:{fontSize:13,fontWeight:"900"},optionGroup:{gap:8},colorChoice:{width:42,height:42,borderRadius:21,borderWidth:3,alignItems:"center",justifyContent:"center"},choice:{minHeight:40,paddingHorizontal:12,borderRadius:999,borderWidth:1,alignItems:"center",justifyContent:"center"},choiceText:{fontSize:12,fontWeight:"800"},check:{color:"white",fontWeight:"900",fontSize:17,textShadowColor:"rgba(0,0,0,.35)",textShadowRadius:3}});
