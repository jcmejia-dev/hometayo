import {nativeAccount} from "@/lib/native-auth";
import {photoPost} from "@/lib/rental-photo-http";
export async function POST(request:Request){return photoPost(request,(await nativeAccount(request))?.id??null);}
