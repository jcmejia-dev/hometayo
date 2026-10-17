import { nativeAccount } from "@/lib/native-auth";
import { operationGet,operationPost } from "@/lib/rental-operation-http";
export const dynamic="force-dynamic";
export async function GET(request:Request){return operationGet(request,(await nativeAccount(request))?.id??null);}
export async function POST(request:Request){return operationPost(request,(await nativeAccount(request))?.id??null);}
