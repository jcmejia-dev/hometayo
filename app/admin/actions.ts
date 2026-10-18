"use server";

import {canAdminister} from "@/lib/admin-owner";
import { sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getDatabase } from "@/lib/db";
import { requireAccount } from "@/lib/session-user";

export async function reviewProperty(form: FormData) {
  const actor = await requireAccount();
  if (!canAdminister(actor)) throw new Error("Not authorized.");
  const id = form.get("id");
  const verdict = form.get("decision");
  const reason = form.get("reason");
  if (typeof id !== "string" || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) throw new Error("Invalid listing.");
  if (verdict !== "approved" && verdict !== "rejected" && verdict!=="removed") throw new Error("Invalid review decision.");
  const explanation = typeof reason === "string" ? reason.trim().slice(0, 500) : "";
  if (verdict !== "approved" && explanation.length < 5) throw new Error("Please explain the moderation decision.");
  const db = getDatabase();
  if (!db) throw new Error("Database not configured.");

  // Single SQL statement ensures listing status and audit log are atomic.
  // Only pending-review listings can transition.
  const result = await db.execute(sql`
    WITH transitioned AS (
      UPDATE listings
      SET status = ${verdict === "approved" ? "published" : verdict},
          published_at = CASE WHEN ${verdict === "approved"} THEN now() ELSE NULL END,
          updated_at = now()
      WHERE id = ${id}::uuid AND ((status = 'pending_review' AND ${verdict} IN ('approved','rejected'))
        OR (status IN ('published','paused','occupied') AND ${verdict}='removed'))
      RETURNING id
    ),
    audited AS (
      INSERT INTO listing_reviews(listing_id, reviewer_id, decision, reason)
      SELECT id, ${actor.id}, ${verdict}, ${explanation || null} FROM transitioned
      RETURNING id
    )
    , activity AS (
      INSERT INTO platform_events (actor_user_id, kind, listing_id)
      SELECT ${actor.id}, ${verdict === "approved" ? "listing.approved" : "listing.rejected"}, id FROM transitioned
      RETURNING id
    )
    SELECT id FROM activity
  `);
  if (result.rows.length === 0) throw new Error("Listing was already reviewed or is unavailable.");
  revalidatePath("/administratorsite");
  revalidatePath("/rentals");
  redirect("/administratorsite?reviewed=1");
}
