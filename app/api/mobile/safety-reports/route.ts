import {NextResponse} from "next/server";
import {z} from "zod";
import {nativeAccount,nativeDb} from "@/lib/native-auth";

const inputSchema=z.object({
  category:z.enum(["scam","harassment","inappropriate_message","fake_listing","other"]),
  details:z.string().trim().max(1000).default(""),
  slug:z.string().trim().max(120).optional(),
  messageId:z.string().uuid().optional(),
  conversationId:z.string().uuid().optional(),
}).refine(v=>Number(Boolean(v.slug))+Number(Boolean(v.messageId))+Number(Boolean(v.conversationId))===1,"Choose one item to report");

export async function POST(request:Request){
  const user=await nativeAccount(request);
  if(!user)return NextResponse.json({message:"Please sign in."},{status:401});
  try{
    const input=inputSchema.parse(await request.json()),db=nativeDb();
    let rows:Array<Record<string,unknown>>=[];
    if(input.slug)rows=await db.query(`SELECT l.id AS listing_id,o.user_id AS target_user_id,NULL::uuid AS message_id FROM listings l JOIN owner_profiles o ON o.id=l.owner_id WHERE l.slug=$1 AND o.user_id<>$2 LIMIT 1`,[input.slug,user.id]);
    if(input.messageId)rows=await db.query(`SELECT c.listing_id,m.sender_id AS target_user_id,m.id AS message_id FROM rental_messages m JOIN rental_conversations c ON c.id=m.conversation_id WHERE m.id=$1::uuid AND $2 IN(c.owner_id,c.renter_id) AND m.sender_id<>$2 LIMIT 1`,[input.messageId,user.id]);
    if(input.conversationId)rows=await db.query(`SELECT c.listing_id,CASE WHEN c.owner_id=$2 THEN c.renter_id ELSE c.owner_id END AS target_user_id,NULL::uuid AS message_id FROM rental_conversations c WHERE c.id=$1::uuid AND $2 IN(c.owner_id,c.renter_id) LIMIT 1`,[input.conversationId,user.id]);
    const target=rows[0];if(!target)return NextResponse.json({message:"This item cannot be reported from your account."},{status:403});
    await db.query(`INSERT INTO safety_reports(reporter_id,target_user_id,listing_id,message_id,category,details) VALUES($1,$2,$3::uuid,$4::uuid,$5,$6)`,[user.id,target.target_user_id,target.listing_id,target.message_id,input.category,input.details]);
    return NextResponse.json({message:"Report sent to HomeTayo administration for review."});
  }catch{return NextResponse.json({message:"Could not submit this report. Please try again."},{status:400});}
}
