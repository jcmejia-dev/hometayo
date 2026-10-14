# Enable HomeTayo accounts

**Current choice: Gmail.** Follow [GMAIL_SETUP.md](GMAIL_SETUP.md) for email delivery without a custom domain. The Resend instructions below remain an alternative.

The app's account forms run inside HomeTayo. Email account creation requires the backend, authentication tables, and verification-email delivery. Styling changes alone cannot enable those services.

## What was checked on 14 October 2026

- The deployed `/api/mobile/auth` endpoint returned 503: native sign-in awaiting setup.
- Local configuration has the database and auth secret, but native/email feature flags and Resend configuration are missing.
- A read-only check of the database referenced by local `.env.local` found none of `native_sessions`, `email_password_credentials`, `auth_email_tokens`, or `auth_rate_limits`. This check does not prove Vercel points to that same database.
- No database migration, verification email, APK build, or production configuration change was performed.

## 1. Set up verification emails

1. Create a [Resend account](https://resend.com/signup).
2. In Domains, add a domain or subdomain you own. Copy the DNS records Resend provides into that domain's DNS settings, then verify it. The `vercel.app` address is your website address; it is not a sending domain you control. See [Resend verified domains](https://resend.com/docs/dashboard/domains/introduction).
3. Create a sending API key restricted to the verified domain where possible. Store it privately in Vercel as `RESEND_API_KEY`. See [Resend API keys](https://resend.com/docs/dashboard/api-keys/introduction).
4. Set `AUTH_EMAIL_FROM` to a sender at that verified domain, for example `HomeTayo <verify@your-domain.com>`. Replace the example domain.

For a private Preview test before you own a domain, Resend's `onboarding@resend.dev` sender can deliver only to the email address on your Resend account. Use `AUTH_EMAIL_FROM=HomeTayo <onboarding@resend.dev>` in that Preview environment and sign up with that same address. Point the app's `EXPO_PUBLIC_API_URL` to that Preview backend, then restart Metro. This is not a public-registration sender; see [Resend's test-domain restriction](https://resend.com/docs/knowledge-base/403-error-resend-dev-domain).

## 2. Prepare the correct HomeTayo database

Confirm that Vercel and local configuration use the intended HomeTayo database, and take a backup/restore point. After authorizing the migration, run from the repository root:

```powershell
cd C:\Users\pc\hometayo
npm run db:migrate
```

This applies tracked migrations 001–004, including email credentials, verification tokens, rate limits, native sessions, and rental coordinates. It does not run automatically during a website build. Do not run it against an unrelated database.

## 3. Configure Vercel and redeploy

Open HomeTayo project → Settings → Environment Variables. Configure these for Production and any Preview environment you intend to test:

| Variable | Value |
| --- | --- |
| `DATABASE_URL` | Existing intended HomeTayo database connection |
| `AUTH_SECRET` | Existing private authentication secret |
| `ENABLE_NATIVE_AUTH` | `true` |
| `ENABLE_EMAIL_PASSWORD_AUTH` | `true` |
| `ENABLE_EMAIL_SIGNUP` | `true` |
| `RESEND_API_KEY` | Private key from step 1 |
| `AUTH_EMAIL_FROM` | Sender at your verified domain |
| `APP_BASE_URL` | `https://hometayoph.vercel.app` |
| `AUTH_GOOGLE_ID` | Existing Google Web OAuth client ID |
| `AUTH_GOOGLE_SECRET` | Existing private Web OAuth client secret |

Keep backend secrets in Vercel or the root ignored `.env.local`; never copy them into `apps/mobile` or an `EXPO_PUBLIC_` variable. Redeploy the backend after the migration and configuration are complete.

Open `https://hometayoph.vercel.app/api/mobile/auth/status` after this change is deployed. It exposes only feature-configuration booleans. Email sign-in and sign-up should be `true`; these flags do not test email delivery or database connectivity, so complete the account test below.

## 4. Test email accounts with your current QR preview

Reload Expo Go → Profile → Sign in or create account → choose Renter or Property owner → Create account. Use an email address you can read and a password of at least 12 characters. Enter the six-digit email code, then sign in. Check Resend's delivery logs if the code does not arrive. Confirm the selected role, close/reopen the app, and sign out.

Both password fields have independent show/hide controls. Switching between sign-in and sign-up clears the form. Failed or unconfigured requests do not create a pretend signed-in account.

## 5. Test Google accounts in the HomeTayo build

Google is visible in the QR preview, but Expo Go cannot execute the native Google account picker. [Expo documents this limitation](https://docs.expo.dev/guides/google-authentication/). Email authentication can be tested in Expo Go after the backend setup above.

For Google, register the Android OAuth client with package `app.hometayo.mobile` and the SHA-1 of the existing EAS signing certificate. Use the same Web client ID for Vercel `AUTH_GOOGLE_ID` and native `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID`. Complete the development/installed-app setup in [NATIVE_AUTH_MAPS_UPDATES.md](NATIVE_AUTH_MAPS_UPDATES.md) and [QR_MOBILE_TESTING.md](QR_MOBILE_TESTING.md). Sign-in returns to native HomeTayo screens; it does not send users to the HomeTayo website.

## Interface assets

The app uses Lucide SVG icons with consistent line weight. The Google mark is the original image from [Google's sign-in branding page](https://developers.google.com/identity/branding-guidelines), stored locally as `apps/mobile/assets/google-g.png`.

Expo Go already contains the SVG module, so you can inspect this design with the QR preview. An older standalone APK without `react-native-svg` needs a new compatible build before receiving this interface through EAS Update. No APK was built during this change.
