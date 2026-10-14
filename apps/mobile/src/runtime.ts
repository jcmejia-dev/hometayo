import Constants,{ExecutionEnvironment} from "expo-constants";

export const isExpoGo=Constants.executionEnvironment===ExecutionEnvironment.StoreClient;
export const mapsAvailable=isExpoGo || Constants.expoConfig?.extra?.mapsConfigured===true;
