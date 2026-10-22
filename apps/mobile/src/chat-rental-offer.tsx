import React,{useCallback,useEffect,useState} from "react";
import {AppState,ScrollView,StyleSheet,Text,TextInput,View} from "react-native";
import {FeedbackPressable as Pressable} from "./feedback-pressable";
import {usePalette} from "./theme";
import {api} from "./session";
import type {OperationsState} from "../../../lib/rental-operation-types";
import type {RentalOffer,RentalOfferState} from "../../../lib/rental-offer-types";

const pesos=(n:number|string)=>"₱"+(Number(n)/100).toLocaleString("en-PH",{minimumFractionDigits:0,maximumFractionDigits:2});
const today=()=>new Date().toISOString().slice(0,10);
type CounterDraft={monthlyRent:string;securityDeposit:string;reservationAmount:string;reservationHours:string;reservationCredit:"none"|"first_rent"|"deposit";leaseStartsOn:string;moveInOn:string;leaseEndsOn:string;note:string};
const emptyDraft:CounterDraft={monthlyRent:"",securityDeposit:"0",reservationAmount:"0",reservationHours:"48",reservationCredit:"none",leaseStartsOn:"",moveInOn:"",leaseEndsOn:"",note:""};

function Button({label,onPress,secondary=false,danger=false,disabled=false}:{label:string;onPress:()=>void;secondary?:boolean;danger?:boolean;disabled?:boolean}){
 const c=usePalette();return <Pressable disabled={disabled} onPress={onPress} style={[s.button,{backgroundColor:danger?"#FFF0EE":secondary?c.white:c.green,borderColor:danger?"#F0BBB5":secondary?c.border:c.green,opacity:disabled?.45:1}]}><Text style={{color:danger?"#B43A31":secondary?c.green:"white",fontSize:10.5,fontWeight:"900"}}>{label}</Text></Pressable>;
}
function Field({label,value,onChange,placeholder="",numeric=false,multiline=false}:{label:string;value:string;onChange:(v:string)=>void;placeholder?:string;numeric?:boolean;multiline?:boolean}){
 const c=usePalette();return <View style={{gap:5}}><Text style={{color:c.muted,fontSize:9,fontWeight:"900",letterSpacing:.5}}>{label.toUpperCase()}</Text><TextInput value={value} onChangeText={onChange} placeholder={placeholder} placeholderTextColor={c.muted} keyboardType={numeric?"numeric":"default"} multiline={multiline} style={[s.input,multiline&&s.textarea,{color:c.green,borderColor:c.border,backgroundColor:c.white}]}/></View>;
}
function Term({label,value}:{label:string;value:string}){const c=usePalette();return <View style={[s.term,{backgroundColor:c.soft}]}><Text style={{color:c.muted,fontSize:8.5,fontWeight:"800"}}>{label.toUpperCase()}</Text><Text style={{color:c.green,fontSize:10.5,fontWeight:"900"}}>{value}</Text></View>}

export function ChatRentalOffer({conversationId,owner,onChanged}:{conversationId:string;owner:boolean;onChanged?:()=>void}){
 const c=usePalette();
 const [ops,setOps]=useState<OperationsState|null>(null),[state,setState]=useState<RentalOfferState>({available:true,offers:[]});
 const [busy,setBusy]=useState(false),[notice,setNotice]=useState(""),[making,setMaking]=useState(false),[countering,setCountering]=useState(false);
 const [unitId,setUnitId]=useState(""),[amount,setAmount]=useState(""),[moveIn,setMoveIn]=useState(""),[note,setNote]=useState("");
 const [draft,setDraft]=useState<CounterDraft>(emptyDraft);

 const load=useCallback(async()=>{
  if(!conversationId)return;
  const [op,offer]=await Promise.all([
   api(`/api/mobile/rental-operations?conversationId=${encodeURIComponent(conversationId)}`),
   api(`/api/mobile/rental-offers?conversationId=${encodeURIComponent(conversationId)}`).catch(()=>({available:false,offers:[]})),
  ]);
  setOps(op);setState(offer);
 },[conversationId]);
 useEffect(()=>{setMaking(false);setCountering(false);setNotice("");void load().catch(()=>{});},[load]);
 useEffect(()=>{const timer=setInterval(()=>{if(AppState.currentState==="active")void load().catch(()=>{});},5000);return()=>clearInterval(timer);},[load]);

 async function act(body:Record<string,unknown>){if(busy)return;setBusy(true);setNotice("");try{const r=await api("/api/mobile/rental-offers",body);setNotice(String(r.message||"Offer updated."));setMaking(false);setCountering(false);await load();onChanged?.();}catch(e){setNotice(e instanceof Error?e.message:"Could not update the offer.");}finally{setBusy(false);}}

 const offers=state.offers||[];
 const active=offers.find(o=>o.status==="pending");
 const latest=offers[0];
 const units=ops?.availableUnits?.filter(u=>u.availableSpots>0)||[];
 const committed=Boolean(ops?.tenancies?.some(t=>["invited","reserved","active","ending"].includes(t.status))||ops?.reservations?.some(r=>["awaiting_payment","proof_submitted","reserved"].includes(r.status))||ops?.requests?.some(r=>r.status==="pending"));

 function startCounter(o:RentalOffer){setDraft({monthlyRent:String(o.monthlyRentCentavos/100),securityDeposit:String(o.securityDepositCentavos/100),reservationAmount:String(o.reservationAmountCentavos/100),reservationHours:String(o.reservationHours),reservationCredit:o.reservationCredit,leaseStartsOn:o.leaseStartsOn,moveInOn:o.moveInOn,leaseEndsOn:o.leaseEndsOn||"",note:""});setCountering(true);setMaking(false);}

 if(!state.available)return null;
 return <View style={s.wrap}>
  {!!notice&&<Text style={[s.notice,{color:c.green,backgroundColor:c.soft}]}>{notice}</Text>}

  {active&&<View style={[s.offerCard,{backgroundColor:c.white,borderColor:c.border,alignSelf:active.mine?"flex-end":"flex-start"}]}>
   <View style={s.head}><View style={[s.offerTag,{backgroundColor:c.soft}]}><Text style={{color:c.green,fontSize:9,fontWeight:"900"}}>{active.proposedByRole==="owner"?"COUNTEROFFER":"RENTAL OFFER"}</Text></View><Text style={{color:c.muted,fontSize:9,fontWeight:"800"}}>{active.mine?"WAITING":"YOUR TURN"}</Text></View>
   <Text style={[s.offerPrice,{color:c.green}]}>{pesos(active.monthlyRentCentavos)}<Text style={{fontSize:11,fontWeight:"700"}}> / month</Text></Text>
   <Text style={{color:c.muted,fontSize:11}}>{active.unitLabel} · move-in {active.moveInOn}</Text>
   <View style={s.termRow}><Term label="Deposit" value={pesos(active.securityDepositCentavos)}/><Term label="Reservation" value={active.reservationAmountCentavos?pesos(active.reservationAmountCentavos):"None"}/></View>
   {!!active.note&&<Text style={[s.quote,{color:c.muted}]}>“{active.note}”</Text>}
   {active.mine?<View style={s.actions}><Button secondary disabled={busy} label="Withdraw" onPress={()=>void act({action:"withdrawOffer",offerId:active.id})}/></View>:<View style={s.actions}><Button disabled={busy} label="Accept" onPress={()=>void act({action:"acceptOffer",offerId:active.id})}/><Button secondary disabled={busy} label="Counter" onPress={()=>startCounter(active)}/><Button danger disabled={busy} label="Decline" onPress={()=>void act({action:"declineOffer",offerId:active.id,reason:"Declined in chat"})}/></View>}
  </View>}

  {!active&&latest&&latest.status==="accepted"&&<View style={[s.offerCard,{backgroundColor:c.soft,borderColor:c.border,alignSelf:"center"}]}><Text style={{color:c.green,fontSize:9,fontWeight:"900",letterSpacing:.8}}>AGREED RENTAL TERMS</Text><Text style={[s.offerPrice,{color:c.green}]}>{pesos(latest.monthlyRentCentavos)}<Text style={{fontSize:11,fontWeight:"700"}}> / month</Text></Text><Text style={{color:c.muted,fontSize:11}}>{latest.unitLabel} · move-in {latest.moveInOn}</Text><Text style={{color:c.green,fontSize:10,fontWeight:"800"}}>Offer accepted · now in reservation flow</Text></View>}

  {!active&&!committed&&!owner&&!making&&<Pressable onPress={()=>setMaking(true)} style={[s.makeOffer,{backgroundColor:c.soft,borderColor:c.border}]}><Text style={{color:c.green,fontWeight:"900",fontSize:12}}>₱ Make an offer</Text><Text style={{color:c.muted,fontSize:10}}>Negotiate rent in this chat</Text></Pressable>}

  {making&&!owner&&!active&&!committed&&<View style={[s.editor,{backgroundColor:c.soft,borderColor:c.border}]}>
   <Text style={{color:c.green,fontSize:13,fontWeight:"900"}}>Make rental offer</Text>
   <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.units}>{units.map(u=><Pressable key={u.id} onPress={()=>{setUnitId(u.id);setAmount(String(u.monthlyRentCentavos/100));}} style={[s.unit,{borderColor:unitId===u.id?c.green:c.border,backgroundColor:c.white}]}><Text style={{color:c.green,fontSize:11,fontWeight:"900"}}>{u.label}</Text><Text style={{color:c.muted,fontSize:9}}>{pesos(u.monthlyRentCentavos)} asking</Text></Pressable>)}</ScrollView>
   <Field label="Monthly offer (₱)" value={amount} onChange={setAmount} numeric/>
   <Field label="Move-in date" value={moveIn} onChange={setMoveIn} placeholder={today()}/>
   <Field label="Message" value={note} onChange={setNote} multiline/>
   <View style={s.actions}><Button disabled={busy||!unitId||!amount||!/^\d{4}-\d{2}-\d{2}$/.test(moveIn)} label="Send offer" onPress={()=>void act({action:"makeOffer",conversationId,unitId,monthlyRent:amount,moveInOn:moveIn,note})}/><Button secondary disabled={busy} label="Cancel" onPress={()=>setMaking(false)}/></View>
  </View>}

  {countering&&active&&!active.mine&&<CounterEditor draft={draft} setDraft={setDraft} busy={busy} cancel={()=>setCountering(false)} submit={()=>void act({action:"counterOffer",offerId:active.id,...draft,reservationHours:Number(draft.reservationHours)||48})}/>}

  {offers.length>1&&<View style={s.history}><Text style={{color:c.muted,fontSize:9,fontWeight:"900",letterSpacing:.8}}>OFFER HISTORY</Text>{offers.slice(1,4).map(o=><View key={o.id} style={[s.historyRow,{borderColor:c.border}]}><View><Text style={{color:c.green,fontSize:10.5,fontWeight:"900"}}>{o.proposedByRole==="owner"?"Owner":"Renter"} · {pesos(o.monthlyRentCentavos)}/mo</Text><Text style={{color:c.muted,fontSize:9.5}}>{o.unitLabel} · {o.moveInOn}</Text></View><Text style={{color:c.muted,fontSize:9,fontWeight:"900",textTransform:"uppercase"}}>{o.status}</Text></View>)}</View>}
 </View>;
}

function CounterEditor({draft,setDraft,busy,cancel,submit}:{draft:CounterDraft;setDraft:(v:CounterDraft)=>void;busy:boolean;cancel:()=>void;submit:()=>void}){
 const c=usePalette();const set=(k:keyof CounterDraft,v:string)=>setDraft({...draft,[k]:v});
 return <View style={[s.editor,{backgroundColor:c.soft,borderColor:c.border}]}><Text style={{color:c.green,fontSize:13,fontWeight:"900"}}>Counteroffer</Text><Field label="Monthly rent (₱)" value={draft.monthlyRent} onChange={v=>set("monthlyRent",v)} numeric/><Field label="Security deposit (₱)" value={draft.securityDeposit} onChange={v=>set("securityDeposit",v)} numeric/><Field label="Reservation payment (₱)" value={draft.reservationAmount} onChange={v=>set("reservationAmount",v)} numeric/><Field label="Reservation window (hours)" value={draft.reservationHours} onChange={v=>set("reservationHours",v)} numeric/><Field label="Lease starts" value={draft.leaseStartsOn} onChange={v=>set("leaseStartsOn",v)}/><Field label="Move-in" value={draft.moveInOn} onChange={v=>set("moveInOn",v)}/><Field label="Lease ends (optional)" value={draft.leaseEndsOn} onChange={v=>set("leaseEndsOn",v)}/><Text style={{color:c.muted,fontSize:9,fontWeight:"900"}}>RESERVATION CREDIT</Text><View style={s.actions}>{([['none','Fee'],['first_rent','First rent'],['deposit','Deposit']] as const).map(([id,label])=><Pressable key={id} onPress={()=>setDraft({...draft,reservationCredit:id})} style={[s.choice,{backgroundColor:draft.reservationCredit===id?c.white:c.soft,borderColor:draft.reservationCredit===id?c.green:c.border}]}><Text style={{color:c.green,fontSize:9.5,fontWeight:"900"}}>{label}</Text></Pressable>)}</View><Field label="Note" value={draft.note} onChange={v=>set("note",v)} multiline/><View style={s.actions}><Button disabled={busy||!draft.monthlyRent||!draft.leaseStartsOn||!draft.moveInOn} label="Send counter" onPress={submit}/><Button secondary disabled={busy} label="Cancel" onPress={cancel}/></View></View>;
}

const s=StyleSheet.create({wrap:{gap:9,paddingVertical:4},notice:{fontSize:10.5,paddingHorizontal:10,paddingVertical:7,borderRadius:10,textAlign:"center"},offerCard:{width:"92%",borderWidth:1,borderRadius:18,padding:13,gap:8},head:{flexDirection:"row",alignItems:"center",justifyContent:"space-between",gap:8},offerTag:{borderRadius:999,paddingHorizontal:8,paddingVertical:4},offerPrice:{fontSize:22,fontWeight:"900"},termRow:{flexDirection:"row",gap:7},term:{flex:1,borderRadius:10,paddingHorizontal:9,paddingVertical:7,gap:2},quote:{fontSize:11,fontStyle:"italic",lineHeight:16},actions:{flexDirection:"row",gap:7,flexWrap:"wrap"},button:{borderWidth:1,borderRadius:999,paddingHorizontal:13,minHeight:34,alignItems:"center",justifyContent:"center"},makeOffer:{alignSelf:"flex-end",borderWidth:1,borderRadius:16,paddingHorizontal:13,paddingVertical:10,alignItems:"flex-end",gap:2},editor:{borderWidth:1,borderRadius:16,padding:12,gap:10},units:{gap:7},unit:{borderWidth:1,borderRadius:12,paddingHorizontal:11,paddingVertical:8,minWidth:100,gap:2},input:{borderWidth:1,borderRadius:12,minHeight:42,paddingHorizontal:11,paddingVertical:8,fontSize:12},textarea:{minHeight:64,textAlignVertical:"top"},choice:{borderWidth:1,borderRadius:999,paddingHorizontal:10,paddingVertical:7},history:{gap:6,paddingTop:3},historyRow:{borderTopWidth:1,paddingTop:7,flexDirection:"row",alignItems:"center",justifyContent:"space-between",gap:8}}
);