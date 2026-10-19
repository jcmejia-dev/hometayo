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

// Git may check files out with CRLF on Windows even though the repository stores LF.
// Normalize line endings before hashing so migration integrity checks are cross-platform.
const normalizeMigration = (value) => value.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
const migrationChecksum = (value) => createHash("sha256").update(normalizeMigration(value)).digest("hex");

// These are the exact historical checksums already verified in the HomeTayo production
// migration ledger. Older runs hashed platform-specific file bytes, and 008 was applied
// before its repository form was finalized. If one of these exact values is encountered,
// reconcile it once to the current normalized checksum. After that, normal strict checksum
// validation applies and future edits to an applied migration will fail.
const verifiedLegacyChecksums = new Map([
  ["001_core.sql", new Set(["329fa7407aa1b43346e00b79a1483aff7b888d96d7c45279b2adcc415ae4836f"])],
  ["002_profiles_admin_activity.sql", new Set(["fb74a5d7f342d4163556ff24ab205b4bfc2666c210d37bbd077f633c2cb87a63"])],
  ["003_email_accounts.sql", new Set(["6474645d7f0ff0c54fc6de098ce90528aa7d2bee3dd42599f152629eb62d92c2"])],
  ["004_native_sessions_locations.sql", new Set(["d2679353be2b8c349ff20bfe27def100ec7a781c35c18459647380aff45d3abe"])],
  ["005_rental_units.sql", new Set(["09570d8a7b05efe16ec97de4341c030145ade3f98b9e395f64eb57661bc63d03"])],
  ["006_rental_operations.sql", new Set(["bb081897982b207ce01a70161cf5660e320b8c8e3ec906d0a050ad093516bcf1"])],
  ["007_profile_photo.sql", new Set(["7cfd50c2beb17c922b5b7d9712b293846844cb5b9518b0958d29b058a6fd2c8d"])],
  ["008_social_safety.sql", new Set(["8bdcbc9ae7ff03b46d04138a41d40fbc8d4998c9f77ff65a9f959b31544553ca"])],
  ["009_platform_announcements.sql", new Set(["0780698e6df1b3b73db0e2c9db526ee83554f3ac201b7f026185e487d7153e90"])],
  ["010_realtime_messaging_push.sql", new Set(["ea28b1d9868864c6fb5c32552956deb13a3cd724244b24f163d00e75f00f8c4a"])],
]);

const dir = join(dirname(dirname(fileURLToPath(import.meta.url))), "db", "migrations");
const files = readdirSync(dir).filter((f) => /^\d+_[a-z0-9_-]+\.sql$/.test(f)).sort();
const client = new pg.Client({ connectionString: process.env.DATABASE_URL, connectionTimeoutMillis: 15000 });
let currentMigration = null;
try {
  await client.connect();
  await client.query("BEGIN");
  await client.query("SELECT pg_advisory_xact_lock(24102026)");
  await client.query("CREATE TABLE IF NOT EXISTS hometayo_schema_migrations (filename TEXT PRIMARY KEY, checksum TEXT NOT NULL, applied_at TIMESTAMPTZ NOT NULL DEFAULT now())");
  for (const filename of files) {
    currentMigration = filename;
    const sql = readFileSync(join(dir, filename), "utf8");
    const checksum = migrationChecksum(sql);
    const previous = await client.query("SELECT checksum FROM hometayo_schema_migrations WHERE filename=$1", [filename]);
    if (previous.rowCount) {
      const recordedChecksum = previous.rows[0].checksum;
      if (recordedChecksum !== checksum) {
        const verifiedLegacy = verifiedLegacyChecksums.get(filename)?.has(recordedChecksum) === true;
        if (!verifiedLegacy) throw new Error("An applied migration has been edited: " + filename);
        await client.query("UPDATE hometayo_schema_migrations SET checksum=$2 WHERE filename=$1", [filename, checksum]);
        console.log("Reconciled legacy checksum: " + filename);
      } else {
        console.log("Already applied: " + filename);
      }
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
  // Keep database credentials out of build logs and chat transcripts while still naming
  // the migration that failed so checksum/schema problems are diagnosable.
  console.error("Migration failed" + (currentMigration ? " at " + currentMigration : "") + ". Verify database settings and migration SQL. Error type:", e instanceof Error ? e.name : "unknown");
  process.exitCode = 1;
} finally {
  await client.end().catch(() => {});
}
