"use server";

import {revalidatePath} from "next/cache";
import {sql} from "drizzle-orm";
import {canAdminister} from "@/lib/admin-owner";
import {getDatabase} from "@/lib/db";
import {currentUser} from "@/lib/session-user";

const allowedAudiences=new Set(["all","renter","landlord"]);
const allowedTones=new Set(["update","info","maintenance"]);

export async function publishAnnouncement(formData:FormData){
 const actor=await currentUser();
 if(!actor||!canAdminister(actor))throw new Error("Administrator access required.");
 const title=String(formData.get("title")||"").trim();
 const body=String(formData.get("body")||"").trim();
 const audience=String(formData.get("audience")||"all");
 const tone=String(formData.get("tone")||"update");
 if(title.length<2||title.length>120)throw new Error("Announcement title must be 2–120 characters.");
 if(body.length<2||body.length>1000)throw new Error("Announcement message must be 2–1000 characters.");
 if(!allowedAudiences.has(audience)||!allowedTones.has(tone))throw new Error("Invalid announcement options.");
 const db=getDatabase();if(!db)throw new Error("Database not configured.");
 await db.execute(sql`INSERT INTO platform_announcements(title,body,audience,tone,created_by) VALUES(${title},${body},${audience},${tone},${actor.id})`);
 revalidatePath("/");revalidatePath("/administratorsite");
}

export async function archiveAnnouncement(formData:FormData){
 const actor=await currentUser();
 if(!actor||!canAdminister(actor))throw new Error("Administrator access required.");
 const id=String(formData.get("id")||"");
 const db=getDatabase();if(!db)throw new Error("Database not configured.");
 await db.execute(sql`UPDATE platform_announcements SET active=false,archived_at=now() WHERE id::text=${id}`);
 revalidatePath("/");revalidatePath("/administratorsite");
}
