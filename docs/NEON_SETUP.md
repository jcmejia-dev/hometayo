# HomeTayo — Neon development setup (Job 2)

## Current status
This branch adds the database schema, explicit non-destructive migrations, public **read-only** approved rental search, and approved property detail pages. Owner authentication, upload forms, moderation actions, alerts, notifications, and payments are **NOT** implemented. No listing submission API is exposed. No migration has been run on any user's database.

## One-time setup

1. Open [Neon](https://console.neon.tech/) and create a **new project**, e.g. `hometayo-dev`. Do **not** reuse your Lakbay database.
2. Get your Neon PostgreSQL connection string (TLS enabled). Save it as `DATABASE_URL` in `C:\Users\pc\hometayo\.env.local`.
3. Never paste `DATABASE_URL` into ChatGPT, GitHub, screenshots, or messages.
4. Run in PowerShell in the HomeTayo folder:

   ```powershell
   npm install
   npm run db:migrate
   npm run dev
   ```

5. Migration should print `Applied migration: 001_core.sql`, or `Already applied` if previously applied. It will create `users`, `owner_profiles`, `listings`, `listing_images`, `listing_reviews`, and `hometayo_schema_migrations`.

Verify tables in Neon's SQL editor:

```sql
SELECT tablename FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('users','owner_profiles','listings','listing_images','listing_reviews','hometayo_schema_migrations')
ORDER BY tablename;
```

Do **not** insert fabricated rental listings. The site intentionally remains empty until owner registration, submission, and admin review are implemented.

## Migration safety
- `db:migrate` must be run **explicitly**; Next.js build and deployment will not run it.
- Migration runner uses a database transaction, advisory transaction lock, and SHA-256 checksums for already-applied migrations.
- It will not truncate or drop tables, but first check if your selected database has incompatible pre-existing tables. `CREATE TABLE IF NOT EXISTS` does **not** validate existing table structures.
- Run only on a separate development database and back up data before changing a populated database.
- No credentials are logged by the migration runner.
- Each migration is versioned under `db/migrations`; once applied, do not edit its contents.

## What happens in the UI?
- No `DATABASE_URL`: the existing honest prelaunch message remains.
- Database empty: “No approved listings match yet.”
- Database temporarily unavailable: “Search is temporarily unavailable.”
- Database contains genuine `published` listings: search renders actual cards, detail pages and approved owner contact methods.
- Only `published` status is publicly queryable. Draft, pending, rejected and removed properties are never in public results.

## Next milestone
Connect secure Google OAuth, owner-specific draft creation, admin review, owner permission tests, and image storage. Do not allow a user to publish their own unmoderated listing or obtain someone else's private account data.
