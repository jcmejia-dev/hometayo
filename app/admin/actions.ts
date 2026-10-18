"use server";

import {canAdminister} from "@/lib/admin-owner";
import { sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getDatabase } from "@/lib/db";
import { requireAccount } from "@/lib/session-user";

const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export async function reviewProperty(form: FormData) {
  const actor=await requireAccount();if(!canAdminister(actor))throw new Error("Not authorized.");
  const id=form.get("id"),verdict=form.get("decision"),reason=form.get("reason");
  if(typeof id!=="string"||!uuid.test(id))throw new Error("Invalid listing.");
  if(verdict!=="approved"&&verdict!=="rejected"&&verdict!=="removed")throw new Error("Invalid review decision.");
  const explanation=typeof reason==="string"?reason.trim().slice(0,500):"";if(verdict!=="approved"&&explanation.length<5)throw new Error("Please explain the moderation decision.");
  const db=getDatabase();if(!db)throw new Error("Database not configured.");
  const result=await db.execute(sql`WITH transitioned AS (
    UPDATE listings SET status=${verdict==="approved"?"published":verdict},published_at=CASE WHEN ${verdict==="approved"} THEN now() ELSE NULL END,updated_at=now()
    WHERE id=${id}::uuid AND ((status='pending_review' AND ${verdict} IN ('approved','rejected')) OR (status IN ('published','paused','occupied') AND ${verdict}='removed')) RETURNING id
  ), audited AS (INSERT INTO listing_reviews(listing_id,reviewer_id,decision,reason) SELECT id,${actor.id},${verdict},${explanation||null} FROM transitioned RETURNING id),
  activity AS (INSERT INTO platform_events(actor_user_id,kind,listing_id) SELECT ${actor.id},${verdict==="approved"?"listing.approved":"listing.rejected"},id FROM transitioned RETURNING id) SELECT id FROM activity`);
  if(result.rows.length===0)throw new Error("Listing was already reviewed or is unavailable.");
  revalidatePath("/administratorsite");revalidatePath("/rentals");redirect("/administratorsite?reviewed=1");
}

export async function moderateAccount(form:FormData){
 const actor=await requireAccount();if(!canAdminister(actor))throw Error("Not authorized.");
 const target=String(form.get("userId")||""),status=String(form.get("status")||"");
 if(!target||target===actor.id||!["active","flagged","banned"].includes(status))throw Error("Invalid moderation action.");
 const db=getDatabase();if(!db)throw Error("Database not configured.");
 const result=await db.execute(sql`WITH changed AS (
   UPDATE users SET account_status=${status},updated_at=now() WHERE id=${target} AND role IN ('renter','landlord') RETURNING id,role
  ), hidden AS (
   UPDATE listings l SET status='paused',updated_at=now() FROM owner_profiles o,changed c WHERE ${status}='banned' AND c.role='landlord' AND o.user_id=c.id AND l.owner_id=o.id AND l.status='published' RETURNING l.id
  ) SELECT id FROM changed`);
 if(!result.rows.length)throw Error("Account could not be moderated.");
 revalidatePath("/administratorsite");revalidatePath("/owner");revalidatePath("/rentals","layout");
}

export async function reviewSafetyReport(form:FormData){
 const actor=await requireAccount();if(!canAdminister(actor))throw Error("Not authorized.");
 const reportId=String(form.get("reportId")||""),status=String(form.get("status")||""),note=String(form.get("note")||"").trim().slice(0,1000);
 if(!uuid.test(reportId)||!["reviewed","actioned","dismissed"].includes(status))throw Error("Invalid report action.");
 const db=getDatabase();if(!db)throw Error("Database not configured.");
 await db.execute(sql`UPDATE safety_reports SET status=${status},admin_note=${note||null},reviewed_at=now(),reviewed_by=${actor.id} WHERE id=${reportId}::uuid`);
 revalidatePath("/administratorsite");
}
