import {useEffect,useRef,useState} from "react";
import {AccessibilityInfo,Animated,AppState,Easing} from "react-native";
export function useReducedMotion(){
  const [reduced,setReduced]=useState(true);
  useEffect(()=>{let alive=true;let changed=false;const sub=AccessibilityInfo.addEventListener("reduceMotionChanged",value=>{changed=true;setReduced(value);});void AccessibilityInfo.isReduceMotionEnabled().then(value=>{if(alive&&!changed)setReduced(value);}).catch(()=>{});return()=>{alive=false;sub.remove();};},[]);
  return reduced;
}
export function useSceneTransition(scene:string,reduced:boolean){
  const opacity=useRef(new Animated.Value(1)).current,x=useRef(new Animated.Value(0)).current;
  const direction=useRef(1),locked=useRef(false),animation=useRef<Animated.CompositeAnimation|null>(null);
  useEffect(()=>{
    animation.current?.stop();
    if(reduced){opacity.setValue(1);x.setValue(0);locked.current=false;return;}
    opacity.setValue(0);x.setValue(direction.current*32);locked.current=true;
    const enter=Animated.parallel([Animated.timing(opacity,{toValue:1,duration:340,useNativeDriver:true}),Animated.spring(x,{toValue:0,damping:23,stiffness:230,mass:.8,useNativeDriver:true})]);
    animation.current=enter;enter.start(({finished})=>{if(finished)locked.current=false;});
    return()=>enter.stop();
  },[scene,reduced,opacity,x]);
  useEffect(()=>()=>{animation.current?.stop();},[]);
  function change(commit:()=>void,forward=true){
    if(locked.current)return;
    direction.current=forward?1:-1;
    if(reduced){commit();return;}
    locked.current=true;
    const exit=Animated.parallel([Animated.timing(opacity,{toValue:0,duration:120,easing:Easing.in(Easing.quad),useNativeDriver:true}),Animated.timing(x,{toValue:-direction.current*24,duration:120,useNativeDriver:true})]);
    animation.current=exit;exit.start(({finished})=>{if(finished)commit();});
  }
  return {change,style:{opacity,transform:[{translateX:x},{scale:opacity.interpolate({inputRange:[0,1],outputRange:[.985,1]})}]}};
}
export function useIllustrationMotion(reduced:boolean){
  const drift=useRef(new Animated.Value(0)).current,pop=useRef(new Animated.Value(1)).current;
  const [active,setActive]=useState(AppState.currentState==="active");
  useEffect(()=>{const sub=AppState.addEventListener("change",state=>setActive(state==="active"));return()=>sub.remove();},[]);
  useEffect(()=>{
    if(reduced||!active){drift.setValue(0);pop.setValue(1);return;}
    pop.setValue(.78);
    const entrance=Animated.spring(pop,{toValue:1,damping:12,stiffness:180,useNativeDriver:true});
    const loop=Animated.loop(Animated.sequence([Animated.timing(drift,{toValue:1,duration:1900,easing:Easing.inOut(Easing.sin),useNativeDriver:true,isInteraction:false}),Animated.timing(drift,{toValue:0,duration:1900,easing:Easing.inOut(Easing.sin),useNativeDriver:true,isInteraction:false})]));
    entrance.start();loop.start();return()=>{entrance.stop();loop.stop();};
  },[reduced,active,drift,pop]);
  return {hero:{transform:[{translateY:drift.interpolate({inputRange:[0,1],outputRange:[0,-9]})},{scale:pop},{rotate:drift.interpolate({inputRange:[0,1],outputRange:["-3deg","3deg"]})}]},tag:{transform:[{translateY:drift.interpolate({inputRange:[0,1],outputRange:[0,5]})}]},satellite:{transform:[{translateY:drift.interpolate({inputRange:[0,1],outputRange:[0,-13]})},{rotate:drift.interpolate({inputRange:[0,1],outputRange:["6deg","-6deg"]})}]}};
}
