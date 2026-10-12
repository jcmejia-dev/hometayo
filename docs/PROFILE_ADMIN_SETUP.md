# Job 4 — Profile & Admin Operations

## What is available

- **/profile**: Google-authenticated users may save a personal preferred name, city, property type and preferred monthly rent. The Browse with preferences link uses the saved filters. Google email and server-assigned roles cannot be edited here.
- **/admin**: authorized admins and moderators see counts from the HomeTayo Neon tables, a snapshot of recent registrations, existing review decisions, new listing activity, and the pending moderation queue.
- **Audit tracking** begins **after migration 002 and the new application code have been activated**. It records explicit listing submissions, approvals/rejections and owner pause actions—not clicks, search queries, revenue, messages, device location or anonymous visitors.
- This is operational reporting, not a complete analytics product. Admin role provisioning stays manual; users cannot make themselves admin.

## REQUIRED: Run the non-destructive Job 4 migration on your HomeTayo project

**Do not run migration against Lakbay or any other database.**

After merging and pulling Job 4, confirm `.env.local` still points to your separate `hometayo-dev` Neon project. Back up or snapshot the DB first if it contains important real data.

```powershell
cd C:\Users\pc\hometayo
git switch main
git pull --ff-only origin main
npm install
npm run db:migrate
```

Expected output:

```text
Already applied: 001_core.sql
Applied migration: 002_profiles_admin_activity.sql
Completed migration check; no existing data was wiped.
```

A second invocation should report both as `Already applied`; this is safe and helps verify consistent migration tracking. Do not change the original SQL migration contents after applying.

Neon SQL Editor verification:

```sql
SELECT column_name FROM information_schema.columns
WHERE table_schema='public' AND table_name='users'
  AND column_name IN ('preferred_name','home_city','preferred_property_type','preferred_budget_pesos')
ORDER BY column_name;

SELECT to_regclass('public.platform_events') AS audit_table;
```

There should be four profile columns and `platform_events`. Do not edit admin roles in the browser; the admin dashboard reads current role from the DB on each request.

## Manual scenario checklist

1. In a separate incognito browser, verify signed-out visitors cannot see /profile data or /admin metrics.
2. Sign in with a renter account. Save a preferred city, budget, preferred name and property type. Reload /profile and confirm persistence. Click Browse with preferences and check resulting URL query filters.
3. Try using /admin as renter: it must return 404.
4. Sign in with your trusted admin account. Open /admin. Confirm counts match Neon's actual tables; do not rely on artificial sample data.
5. Submit an *authorized test property* using a renter account and verify one `listing.submitted` event. Reopen admin queue; approve only a legitimate listing and verify its moderation and activity audit records. Reject made-up development tests instead of publishing them.
6. Test pause as the owning account. The corresponding published listing should disappear from /rentals and appear in admin activity.
7. Verify narrow phone, tablet and desktop layout. Google authenticated E2E requires user-controlled local credentials; CI runs in the guest state only.

## Privacy & security constraints

Admins can read operational data; this is not blanket permission to monitor private renter behavior. The activity log contains only actor ID, event category, optional listing ID and timestamp. Viewing full emails, private conversations and payment records is not implemented in Job 4. Restrict database access, preserve admin audit history and establish retention/deletion policies before production. Rotating previously exposed Auth/Neon/Google credentials and resolving outstanding npm audit high-severity findings remain launch blockers.

No third-party visitor tracking or monetization SDK is installed; no database rows or settings are populated automatically by the migration.
