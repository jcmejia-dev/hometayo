import type { ExpoConfig, ConfigContext } from "expo/config";

const HOME_TAYO_EAS_PROJECT_ID="55714287-6e36-4377-8807-460f5027bd7c";

export default ({config}:ConfigContext):ExpoConfig => {
  const projectId=process.env.EAS_PROJECT_ID || config.extra?.eas?.projectId || HOME_TAYO_EAS_PROJECT_ID;
  const updateChannel=process.env.EAS_UPDATE_CHANNEL?.trim()||"preview";
  const mapsKey=process.env.GOOGLE_MAPS_ANDROID_API_KEY?.trim();
  // GitHub Actions exposes GOOGLE_SERVICES_FILE; EAS file variables expose GOOGLE_SERVICES_JSON.
  const googleServicesFile=process.env.GOOGLE_SERVICES_FILE?.trim()||process.env.GOOGLE_SERVICES_JSON?.trim();
  const ciVersionCode=Number.parseInt(process.env.ANDROID_VERSION_CODE||"",10);
  const versionCode=Number.isInteger(ciVersionCode)&&ciVersionCode>0?ciVersionCode:5;
  const appVersion=process.env.APP_VERSION?.trim()||"0.5.0";

  if(process.env.EAS_BUILD==="true"&&process.env.REQUIRE_ANDROID_MAPS==="true"&&!mapsKey){
    throw new Error("Set GOOGLE_MAPS_ANDROID_API_KEY in the EAS preview environment before building preview-maps.");
  }
  if(process.env.REQUIRE_EAS_UPDATES==="true"&&!projectId){
    throw new Error("EAS_PROJECT_ID is required for the OTA-enabled HomeTayo APK.");
  }
  if(process.env.REQUIRE_PUSH_NOTIFICATIONS==="true"&&!googleServicesFile){
    throw new Error("GOOGLE_SERVICES_FILE or GOOGLE_SERVICES_JSON is required for Android push notifications.");
  }

  return {
    ...config,
    name:"HomeTayo",
    slug:"hometayo-native",
    version:appVersion,
    platforms:["android","ios"],
    android:{
      ...config.android,
      versionCode,
      ...(googleServicesFile?{googleServicesFile}:{}),
      adaptiveIcon:{
        ...config.android?.adaptiveIcon,
        foregroundImage:"./assets/adaptive-icon.png",
        backgroundColor:"#073C29",
      },
    },
    plugins:[
      "expo-dev-client",
      "expo-secure-store",
      ["expo-image-picker",{
        photosPermission:"HomeTayo uses selected photos only when you add or update your rental listing.",
        cameraPermission:"HomeTayo can use your camera when you choose to take a property photo.",
        microphonePermission:false,
      }],
      ["expo-location",{locationWhenInUsePermission:"Use your location to show nearby rentals and approximate distances."}],
      ["expo-notifications",{color:"#173D32",defaultChannel:"messages"}],
      "@react-native-google-signin/google-signin",
      ["react-native-maps",{androidGoogleMapsApiKey:mapsKey||""}],
    ],
    runtimeVersion:{policy:"appVersion"},
    updates:{
      url:"https://u.expo.dev/"+projectId,
      checkAutomatically:"NEVER" as const,
      requestHeaders:{"expo-channel-name":updateChannel},
    },
    extra:{
      ...config.extra,
      note:"HomeTayo native renter/owner parity with social rental feed, management and safety reporting.",
      mapsConfigured:Boolean(mapsKey),
      pushConfigured:Boolean(googleServicesFile),
      updateChannel,
      eas:{projectId},
    },
  };
};
