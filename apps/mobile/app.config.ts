import type { ExpoConfig, ConfigContext } from "expo/config";

export default ({config}:ConfigContext):ExpoConfig => {
  const projectId=process.env.EAS_PROJECT_ID || config.extra?.eas?.projectId;
  const mapsKey=process.env.GOOGLE_MAPS_ANDROID_API_KEY?.trim();
  const ciVersionCode=Number.parseInt(process.env.ANDROID_VERSION_CODE||"",10);
  const versionCode=Number.isInteger(ciVersionCode)&&ciVersionCode>0?ciVersionCode:5;
  const appVersion=process.env.APP_VERSION?.trim()||"0.3.0";
  if(process.env.EAS_BUILD==="true"&&process.env.REQUIRE_ANDROID_MAPS==="true"&&!mapsKey)throw new Error("Set GOOGLE_MAPS_ANDROID_API_KEY in the EAS preview environment before building preview-maps.");
  return {...config,name:"HomeTayo",slug:"hometayo-native",version:appVersion,platforms:["android","ios"],
    android:{...config.android,versionCode,adaptiveIcon:{...config.android?.adaptiveIcon,foregroundImage:"./assets/adaptive-icon.png",backgroundColor:"#073C29"}},
    plugins:["expo-dev-client","expo-secure-store",["expo-image-picker",{photosPermission:"HomeTayo uses selected photos only when you add or update your rental listing.",cameraPermission:"HomeTayo can use your camera when you choose to take a property photo.",microphonePermission:false}],["expo-location",{locationWhenInUsePermission:"Use your location to show nearby rentals and approximate distances."}],"@react-native-google-signin/google-signin",["react-native-maps",{androidGoogleMapsApiKey:mapsKey || ""}]],
    runtimeVersion:{policy:"fingerprint"},
    ...(projectId?{updates:{url:"https://u.expo.dev/"+projectId,checkAutomatically:"NEVER" as const}}:{}),
    extra:{...config.extra,note:"HomeTayo native renter/owner parity with social rental feed, management and safety reporting.",mapsConfigured:Boolean(mapsKey),...(projectId?{eas:{projectId}}:{})},
  };
};
