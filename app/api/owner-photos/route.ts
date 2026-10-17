import {NextResponse} from "next/server";
import {currentUser} from "@/lib/session-user";
import {photoPost} from "@/lib/rental-photo-http";
export async function POST(request:Request){if(request.headers.get("origin")!==new URL(request.url).origin)return NextResponse.json({message:"Invalid origin."},{status:403});return photoPost(request,(await currentUser())?.id??null);}
