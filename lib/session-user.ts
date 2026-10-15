import "server-only";
import {publicAccountRole} from "./admin-policy";
import { eq, sql } from "drizzle-orm";
import { auth, authIsConfigured } from "@/auth";
import { getDatabase } from "@/lib/db";
import { users } from "@/db/schema";

export async function currentUser() {
  if (!authIsConfigured()) return null;
  const session = await auth();
  const id = session?.user?.id;
  if (!id || !(id.startsWith("google:") || id.startsWith("email:"))) return null;
  const db = getDatabase();
  if (!db) return null;
  const [account] = await db.select({
    id: users.id, email: users.email, displayName: sql<string | null>`COALESCE(${users.preferredName},${users.displayName})`, role: users.role,
  }).from(users).where(eq(users.id, id)).limit(1);
  return account?{...account,role:publicAccountRole(account.role)}:null;
}

export async function requireAccount() {
  const user = await currentUser();
  if (!user) throw new Error("Please sign in to continue.");
  return user;
}
