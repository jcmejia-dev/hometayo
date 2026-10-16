import React,{useEffect,useRef,useState} from "react";
import {Animated,Pressable,StyleSheet,type PressableProps} from "react-native";
import {usePalette,useTheme} from "./theme";
const AnimatedPressable=Animated.createAnimatedComponent(Pressable);
export function FeedbackPressable({style,children,onPressIn,onPressOut,disabled,android_ripple,...props}:PressableProps){
 const colors=usePalette(),reduced=useTheme().reducedMotion,scale=useRef(new Animated.Value(1)).current,[pressed,setPressed]=useState(false);
 useEffect(()=>()=>scale.stopAnimation(),[scale]);
 const resolved=typeof style==="function"?style({pressed}):style,flat=StyleSheet.flatten(resolved);
 function animate(down:boolean){setPressed(down);scale.stopAnimation();if(reduced){scale.setValue(1);return;}Animated.spring(scale,{toValue:down?.965:1,damping:18,stiffness:360,mass:.55,useNativeDriver:true}).start();}
 return <AnimatedPressable {...props} disabled={disabled} accessibilityState={{...props.accessibilityState,disabled:!!disabled}} android_ripple={android_ripple||{color:colors.border,foreground:true}} onPressIn={event=>{animate(true);onPressIn?.(event);}} onPressOut={event=>{animate(false);onPressOut?.(event);}} style={[resolved,{opacity:(typeof flat?.opacity==="number"?flat.opacity:1)*(pressed?.8:1),transform:[...(Array.isArray(flat?.transform)?flat.transform:[]),{scale}]}]}>{typeof children==="function"?children({pressed}):children}</AnimatedPressable>;
}
