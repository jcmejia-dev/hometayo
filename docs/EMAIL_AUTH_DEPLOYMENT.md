# HomeTayo — email/password accounts and polished sign-in

## New routes

- \`/sign-in\` — labeled email/password form and Google OAuth, with distinct Sign In and Create Account tabs
- \`/sign-up\` — labeled full-name, email, password and password-confirmation form; also Google sign-up
- \`/verify-email?token=...\` — one-time email verification with an explicit confirmation button (avoids accidental email-client link prefetch)
- \`/forgot-password\` and \`/reset-password?token=...\` — email password recovery with single-use, 30-minute reset tokens

Existing Google identities, user permissions, owner listings and administrators are unchanged. Email accounts have unique \`email:\` IDs, start as renters, and must verify email before sign-in. No self-promotion to admin.

## IMPORTANT — staging before enabling public email registration

**DO NOT ENABLE EMAIL PASSWORD AUTH OR EMAIL SIGN-UP UNTIL** a verified Resend sending domain, security and privacy review, abuse controls and the corresponding migration are ready. The form is explicitly disabled until the required configuration is present. Google sign-in remains an option.

1. In your **dedicated HomeTayo Neon project**, make a backup/snapshot. Confirm it is not the Lakbay database. From the latest GitHub code run \`npm run db:migrate\`. The migration runner must print \`Applied migration: 003_email_accounts.sql\` and the old filenames should be \`Already applied\`. Existing accounts/roles are not modified.
2. In Vercel **Production** environment variables, preserve \`DATABASE_URL\`, \`AUTH_SECRET\`, \`AUTH_GOOGLE_ID\`, \`AUTH_GOOGLE_SECRET\`. To use email registration, additionally add the following private values (do not paste them in GitHub, screenshots or chat):

\`\`\`dotenv
APP_BASE_URL=https://hometayo-snyn.vercel.app
ENABLE_EMAIL_PASSWORD_AUTH=true
RESEND_API_KEY=<private-Resend-key>
AUTH_EMAIL_FROM=HomeTayo <verify@your-verified-domain.example>
ENABLE_EMAIL_SIGNUP=true
\`\`\`

3. The sender domain must be verified through your Resend account. Resend imposes sending limits; its free/test-only mode may not deliver to arbitrary recipients. Configure DNS authentication as required by Resend. **Do not** publish a fake sender domain.
4. Google Cloud (HomeTayo OAuth Web client) must permit \`https://hometayo-snyn.vercel.app\` as an authorized origin and \`https://hometayo-snyn.vercel.app/api/auth/callback/google\` as a redirect URI. Keep \`http://localhost:3000\` localhost entries for local dev.
5. Redeploy after setting variables. The production Vercel host is trusted in \`auth.ts\`. Set \`APP_BASE_URL\` to the actual production domain, not the Vercel preview URL or a custom domain you haven't configured.
6. Test sign-up email delivery, verify button, first sign-in, invalid password, throttling, recovery, and Google OAuth. Test separately as renter and trusted admin. Never send sensitive credentials in chat.

## Security characteristics and limits

- Passwords are salted with 128-bit random salts and hashed asynchronously with Node \`scrypt\`, 64-byte output; no plain-text passwords.
- Registration refuses an existing Google email, rather than silently linking identities. User role cannot be selected at sign-up.
- Email login requires verified email and is rate-limited by an atomic database counter (8 attempts/email/15 minutes).
- Signup and password reset requests are also rate-limited by email; email identifiers are HMAC-hashed in the limiter table.
- Verification tokens (24h) and reset tokens (30m) are random, stored as SHA-256 digests, single-use and deleted upon consumption; reset/verify pages have a no-referrer policy.
- Registration is OFF by default unless mail delivery and \`ENABLE_EMAIL_SIGNUP=true\` are configured. After migration 003, set \`ENABLE_EMAIL_PASSWORD_AUTH=true\` to enable email login. Email login remains accessible for existing verified accounts when the sending provider is temporarily unavailable; new sign-ups still require \`ENABLE_EMAIL_SIGNUP=true\` and a verified mail sender.
- The public-facing app **is not yet production-security certified**. Before opening registration publicly, add IP/network-level anti-abuse (Vercel WAF or equivalent), CAPTCHA/bot controls, operational monitoring, session revocation upon password reset, audited deletion/export and retention policies, and address dependency vulnerabilities. Fix exposed auth/provider/Neon credentials.
- Existing Google users have separate sign-in and account recovery. Google passwords are never stored by HomeTayo.

No migrations are ever run automatically on GitHub Actions or Vercel build. Manual migration is REQUIRED for functional email accounts.
