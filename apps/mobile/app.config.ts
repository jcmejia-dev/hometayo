import type { ExpoConfig, ConfigContext } from "expo/config";

export default ({config}:ConfigContext):ExpoConfig => {
  const projectId=process.env.EAS_PROJECT_ID || config.extra?.eas?.projectId;
  const mapsKey=process.env.GOOGLE_MAPS_ANDROID_API_KEY?.trim();
  if(process.env.REQUIRE_ANDROID_MAPS==="true"&&!mapsKey)throw new Error("Set GOOGLE_MAPS_ANDROID_API_KEY in the EAS preview environment before building preview-maps.");
  return {...config,name:"HomeTayo",slug:"hometayo-native",version:"0.2.0",platforms:["android","ios"],
    android:{...config.android,versionCode:3},
    plugins:["expo-dev-client","expo-secure-store",["expo-location",{locationWhenInUsePermission:"Use your location to show nearby rentals and approximate distances."}],"@react-native-google-signin/google-signin",["react-native-maps",{androidGoogleMapsApiKey:mapsKey || ""}]],
    runtimeVersion:{policy:"fingerprint"},
    ...(projectId?{updates:{url:"https://u.expo.dev/"+projectId,checkAutomatically:"NEVER" as const}}:{}),
    extra:{...config.extra,note:"HomeTayo native accounts and public rental API; secrets remain on the backend.",mapsConfigured:Boolean(mapsKey),...(projectId?{eas:{projectId}}:{})},
  };
};
