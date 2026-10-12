// Explicit, transactional, non-destructive migrations. Does not run during build.
// Run with: npm run db:migrate — ONLY against the dedicated HomeTayo database.
import pg from "pg";
import { createHash } from "node:crypto";
import { readFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL missing. Configure a separate HomeTayo Neon database in .env.local.");
  process.exit(1);
}
const dir = join(dirname(dirname(fileURLToPath(import.meta.url))), "db", "migrations");
const files = readdirSync(dir).filter((f) => /^\d+_[a-z0-9_-]+\.sql$/.test(f)).sort();
const client = new pg.Client({ connectionString: process.env.DATABASE_URL, connectionTimeoutMillis: 15000 });
try {
  await client.connect();
  await client.query("BEGIN");
  await client.query("SELECT pg_advisory_xact_lock(24102026)");
  await client.query("CREATE TABLE IF NOT EXISTS hometayo_schema_migrations (filename TEXT PRIMARY KEY, checksum TEXT NOT NULL, applied_at TIMESTAMPTZ NOT NULL DEFAULT now())");
  for (const filename of files) {
    const sql = readFileSync(join(dir, filename), "utf8");
    const checksum = createHash("sha256").update(sql).digest("hex");
    const previous = await client.query("SELECT checksum FROM hometayo_schema_migrations WHERE filename=$1", [filename]);
    if (previous.rowCount) {
      if (previous.rows[0].checksum !== checksum) throw new Error("An applied migration has been edited: " + filename);
      console.log("Already applied: " + filename);
      continue;
    }
    await client.query(sql);
    await client.query("INSERT INTO hometayo_schema_migrations(filename, checksum) VALUES ($1,$2)", [filename, checksum]);
    console.log("Applied migration: " + filename);
  }
  await client.query("COMMIT");
  console.log("Completed migration check; no existing data was wiped.");
} catch (e) {
  await client.query("ROLLBACK").catch(() => {});
  // Keep database credentials out of build logs and chat transcripts.
  console.error("Migration failed. Verify database settings and migration SQL. Error type:", e instanceof Error ? e.name : "unknown");
  process.exitCode = 1;
} finally {
  await client.end().catch(() => {});
}
