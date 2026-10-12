import "server-only";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "@/db/schema";

/** Return null before Neon is configured. Never create a connection at build time. */
export function getDatabase() {
  const url = process.env.DATABASE_URL;
  if (!url) return null;
  return drizzle({ client: neon(url), schema });
}
