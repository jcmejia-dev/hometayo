import {usePalette,useThemedStyles} from "./theme";
import {colors} from "./design";
import React,{useEffect,useRef} from "react";
import {Animated,StyleSheet,Text,View} from "react-native";
import Svg,{Circle,Path,Rect} from "react-native-svg";
import {Icon} from "./icons";
import {useIllustrationMotion} from "./motion";
export function OnboardingArt({variant,tag,reduced}:{variant:"home"|"map"|"keys";tag:string;reduced:boolean}){
  const colors=usePalette(); const s=useThemedStyles(baseStyles);

  const pieces=useRef([new Animated.Value(1),new Animated.Value(1),new Animated.Value(1)]).current;
  const float=useIllustrationMotion(reduced);
  useEffect(()=>{
    if(reduced){pieces.forEach(p=>p.setValue(1));return;}
    pieces.forEach(p=>p.setValue(0));
    const entrance=Animated.stagger(95,pieces.map(p=>Animated.spring(p,{toValue:1,damping:12,stiffness:150,mass:.8,useNativeDriver:true})));
    entrance.start();return()=>entrance.stop();
  },[pieces,reduced,variant]);
  const enter=(i:number,drop=false)=>({opacity:pieces[i].interpolate({inputRange:[0,1],outputRange:[0,1],extrapolate:"clamp"}),transform:[{translateY:pieces[i].interpolate({inputRange:[0,1],outputRange:[drop?-55:35,0]})},{scale:pieces[i].interpolate({inputRange:[0,1],outputRange:[.7,1]})}]});
  return <View style={s.stage}>
    <View style={s.halo}/><View style={s.haloOuter}/>
    {variant==="home"?<>
      <Animated.View style={[s.sun,enter(0,true)]}/>
      <Animated.View style={[s.cloud,float.tag]}><Svg width={66} height={30} viewBox="0 0 66 30"><Path d="M9 27C-3 25 1 10 12 11C12-4 38-3 39 11C54 3 68 14 62 26Z" fill={colors.muted}/></Svg></Animated.View>
      <Animated.View style={[s.houseBody,enter(0)]}><Svg width={154} height={118} viewBox="0 0 154 118"><Rect x={12} y={0} width={130} height={112} rx={7} fill="#F4EAD3"/><Rect x={12} y={0} width={130} height={11} fill="#D5C8A9"/><Rect x={58} y={48} width={40} height={64} rx={5} fill={colors.sage}/><Circle cx={89} cy={83} r={3} fill="#EBC18A"/><Rect x={27} y={27} width={23} height={29} rx={4} fill={colors.border}/><Path d="M38 27V56M27 41H50" stroke="#FFF9E8" strokeWidth={3}/><Rect x={105} y={27} width={23} height={29} rx={4} fill={colors.border}/><Path d="M116 27V56M105 41H128" stroke="#FFF9E8" strokeWidth={3}/><Rect x={0} y={110} width={154} height={8} rx={4} fill="#C69D60"/></Svg></Animated.View>
      <Animated.View style={[s.roof,enter(1,true)]}><Svg width={180} height={84} viewBox="0 0 180 84"><Path d="M130 45V7H151V61" fill="#EED6AD"/><Path d="M7 78L90 8L173 78" stroke="#EBC18A" strokeWidth={15} strokeLinecap="round" strokeLinejoin="round"/></Svg></Animated.View>
      <Animated.View style={[s.plant,enter(2)]}><Svg width={44} height={63} viewBox="0 0 44 63"><Path d="M22 45V12M22 31C-1 33 0 6 22 22M22 22C39 0 52 21 22 37" stroke={colors.sage} strokeWidth={5} strokeLinecap="round"/><Path d="M7 44H37L32 62H12Z" fill="#D6AB74"/></Svg></Animated.View>
    </>:variant==="map"?<>
      <Animated.View style={[s.map,enter(0)]}><Svg width={234} height={157} viewBox="0 0 234 157"><Rect width={234} height={157} rx={19} fill={colors.border}/><Path d="M-10 40L244 120M45-10L157 170M-5 143L240 8" stroke="#F7F2E3" strokeWidth={16}/><Path d="M48 117C84 130 76 66 124 68C167 68 140 34 181 30" stroke="#A78148" strokeWidth={3} strokeDasharray="5 6" fill="none"/><Circle cx={48} cy={117} r={7} fill={colors.muted}/></Svg></Animated.View>
      <Animated.View style={[s.mapHouse,enter(1)]}><Icon name="home" size={24} color={colors.green}/></Animated.View>
      <Animated.View style={[s.mapPin,enter(2,true)]}><Animated.View style={float.hero}><Icon name="pin" size={70} color="#EBC18A"/></Animated.View></Animated.View>
    </>:<>
      <Animated.View style={[s.miniHome,s.miniHomeLeft,enter(0)]}><Icon name="home" size={35} color={colors.muted}/><View style={s.tinyLine}/><View style={[s.tinyLine,{width:30}]}/></Animated.View>
      <Animated.View style={[s.miniHome,s.miniHomeRight,enter(1)]}><Icon name="building" size={35} color={colors.muted}/><View style={s.tinyLine}/><View style={[s.tinyLine,{width:30}]}/></Animated.View>
      <Animated.View style={[s.key,enter(2,true)]}><Animated.View style={float.hero}><Icon name="key" size={90} color="#EBC18A"/></Animated.View></Animated.View>
    </>}
    <Animated.View style={[s.tag,float.tag]}><Icon name={variant==="map"?"location":variant==="keys"?"key":"home"} size={15}/><Text style={s.tagText}>{tag}</Text></Animated.View>
  </View>;
}
const baseStyles=StyleSheet.create({stage:{height:250,backgroundColor:colors.green,borderRadius:30,alignItems:"center",justifyContent:"center",marginBottom:30,overflow:"hidden"},halo:{position:"absolute",height:206,width:206,borderRadius:103,backgroundColor:colors.green},haloOuter:{position:"absolute",height:290,width:290,borderRadius:145,borderWidth:1,borderColor:colors.sage},sun:{position:"absolute",height:43,width:43,borderRadius:24,backgroundColor:"#C79753",top:24,right:46},cloud:{position:"absolute",left:28,top:37},houseBody:{position:"absolute",top:81},roof:{position:"absolute",top:21},plant:{position:"absolute",top:139,left:33},tag:{position:"absolute",bottom:15,flexDirection:"row",gap:8,alignItems:"center",paddingVertical:10,paddingHorizontal:13,backgroundColor:"#F3E6CC",borderRadius:30},tagText:{fontSize:10,fontWeight:"700",color:colors.green},map:{position:"absolute",top:36,transform:[{rotate:"-7deg"}]},mapPin:{position:"absolute",top:26,left:"49%"},mapHouse:{position:"absolute",top:126,left:67,backgroundColor:"#FFF8E9",padding:10,borderRadius:12},miniHome:{position:"absolute",width:92,height:105,padding:15,borderRadius:16,backgroundColor:"#F2E8D3",alignItems:"center",gap:9,top:57},miniHomeLeft:{left:35},miniHomeRight:{right:35,top:40},tinyLine:{width:48,height:4,borderRadius:4,backgroundColor:colors.border},key:{position:"absolute",top:82},});
