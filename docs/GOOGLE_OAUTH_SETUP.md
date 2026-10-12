# HomeTayo Job 3 — Google sign-in and property-management setup

HomeTayo's six existing Neon tables are sufficient for this first owner/authentication milestone. **No new database migration is required.** Never share Google OAuth Client Secret, AUTH_SECRET, database URLs, access tokens, or your .env.local.

## Create Google OAuth credentials

1. Open https://console.cloud.google.com/apis/credentials and create a Google Cloud project dedicated to HomeTayo.
2. In Google Auth Platform, configure the **OAuth consent screen**, application name HomeTayo, email, and **External** audience. While the app is in testing, add only your chosen test Google account(s).
3. Create a new **OAuth client ID → Web application**.
4. Authorized JavaScript origin: `http://localhost:3000`
5. Authorized redirect URI: `http://localhost:3000/api/auth/callback/google`
6. Store the issued client ID and client secret **only** in your locally ignored `.env.local` file. No values should go to the public GitHub repository.

Generate a secure secret in PowerShell:

```powershell
node -e "console.log(require('node:crypto').randomBytes(32).toString('base64url'))"
```

Your local .env.local must have these keys:

```dotenv
DATABASE_URL="your-existing-private-neon-url"
AUTH_SECRET="your-own-random-secret"
AUTH_GOOGLE_ID="your-own-google-client-id"
AUTH_GOOGLE_SECRET="your-own-google-client-secret"
```

Keep your existing real DATABASE_URL. **Do not copy the sample strings verbatim** and do not reveal any of these values in screenshots or logs.

## Activate locally

```powershell
git switch main
git pull --ff-only origin main
npm install
npm run dev
```

After the feature PR is merged, visit `http://localhost:3000/sign-in` and continue with Google. If you have not configured the credentials yet, the page will display an honest setup message rather than enabling fake login.

The user must exist in `users` after a successful OAuth sign-in. It has the default `renter` role; an authenticated user may submit owner listing details after completing the submission form. **Owner status is identified by a scoped owner_profiles record, not a browser-supplied role.** Listing status is initially `pending_review` and cannot be published by the owner action.

## Promote one trusted administrator (optional, after first successful Google login)

In the **HomeTayo Neon** SQL Editor, only after signing in with your own trusted Google account, run the query below with **your own verified signed-in email**. Do not promote random addresses or copy another app's administrator identity:

```sql
UPDATE users
SET role = 'admin', updated_at = now()
WHERE email = 'YOUR_SIGNED_IN_GOOGLE_EMAIL'
RETURNING id, role;
```

Confirm exactly one row returned. The administrator can then visit `/admin` to review pending listings. Privileged authorization is checked against the database on each server-side action; there is no admin signup route and no field where a user can choose an elevated role.

## Boundaries and security

- Google OAuth requires `email_verified`. User IDs derive from Google's immutable subject, not email.
- Auth uses encrypted JWT session cookies; owner and admin permissions are checked in the database.
- The owner server action validates submitted fields and always creates `pending_review` listings; owners cannot approve themselves.
- Moderators can approve/reject, with an audit entry written atomically in the database. An owner can pause their **own** published listings.
- This phase does not yet provide photo uploads, self-editing, deleted-account handling, ownership verification, dispute appeals, or rate limiting. These require additional work **before public launch**.
- Keep the system private/beta until ownership-verification operations are working.
- Job 3 has been coded and CI-tested without real credentials. **Actual OAuth sign-in, Neon owner writes, and admin-review operation remain unverified until a local test with your own credentials and trusted test listings.**

## Testing

Run `npm run lint`, `npm run typecheck`, `npm run build`, and `npm run test:e2e`. GitHub Actions runs these without OAuth secrets, checking graceful prelogin page behavior.

If OAuth returns "redirect_uri_mismatch", confirm that your Google Cloud OAuth **Web application** has exactly `http://localhost:3000/api/auth/callback/google`. If "access blocked" appears, check the Google consent testing audience and test users. Never paste secret values into chat.

## Next

After local OAuth tests: add owner editing, identity/authority verification, secure photo storage/uploads, rental request capture and rate limiting. Before public launch, review the six npm audit warnings raised during setup; run `npm audit --omit=dev` and address confirmed production exposure without unreviewed forced dependency upgrades.
