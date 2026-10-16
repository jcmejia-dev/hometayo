import React from "react";
import {Image} from "react-native";

export function BrandMark({size=34}:{size?:number}){
  return <Image source={require("../assets/icon.png")} accessibilityLabel="HomeTayo connected homes" accessibilityRole="image" style={{width:size,height:size,borderRadius:size*.22}} resizeMode="contain"/>;
}
