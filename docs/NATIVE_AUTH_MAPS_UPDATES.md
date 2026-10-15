# HomeTayo app: in-app accounts, map search and updates

## What this release changes

- Email sign-up, six-digit email verification, sign-in and account choice run in native screens. Google sign-in uses the Android Google account picker; it does not open HomeTayo in a web browser.
- Native sessions last seven days, use random opaque bearer tokens stored in Expo SecureStore, and are stored only as token hashes on the backend. Logout revokes the session; password reset revokes native sessions. Session expiry returns users to account entry.
- Renters can browse all cities, select a destination (for example KCC Mall, Koronadal), use their current location, or long-press the map. Published rentals are ranked by distance across the entire database before pagination. Radius filters are 1–25 km in the app. Distance is a straight-line estimate, not walking/driving distance or time. If a renter has supplied their own location, the app also shows their distance to each pinned rental while ranking by the selected destination.
- Property owners can submit rentals, see review status, and set/update map pins inside the app. Pin updates require ownership and send the rental back for administrator review. Unpinned rentals remain in all-location lists, but cannot appear in a distance-radius search.
- Update app checks for a compatible EAS Update, downloads it, and asks whether to restart. Native module changes still need a new APK.

## 1. Backend / Vercel setup

For Gmail instead of Resend, follow [GMAIL_SETUP.md](GMAIL_SETUP.md). Set `AUTH_EMAIL_PROVIDER=gmail`, `GMAIL_USER`, and `GMAIL_APP_PASSWORD`; `RESEND_API_KEY` and `AUTH_EMAIL_FROM` are not needed in that mode. The database migrations and authentication flags below still apply.

Use the dedicated HomeTayo Neon database. Back up and verify its identity before explicitly running `npm run db:migrate` from the repository root. Migration 004 adds native sessions and property coordinates. Migrations 001–003 must also be applied. No migration runs automatically during build.

Configure private Vercel production variables:

```dotenv
ENABLE_NATIVE_AUTH=true
DATABASE_URL=<existing HomeTayo database URL>
AUTH_SECRET=<existing secret>
ENABLE_EMAIL_PASSWORD_AUTH=true
ENABLE_EMAIL_SIGNUP=true
RESEND_API_KEY=<private Resend key>
AUTH_EMAIL_FROM=HomeTayo <verify@your-verified-domain>
APP_BASE_URL=https://hometayoph.vercel.app
AUTH_GOOGLE_ID=<Google Web OAuth client ID>
AUTH_GOOGLE_SECRET=<existing private Google Web client secret>
GOOGLE_PLACES_API_KEY=<server-only Places API New key>
```

Verify the Resend sender and email delivery before enabling public sign-up. The native app never receives the database URL, OAuth secret, Resend key or server Places key. Deploy the backend only after configuration and migration. Native authentication otherwise responds with an honest setup/unavailable message.

## 2. Google Maps and destination search

In Google Cloud, enable Maps SDK for Android and Places API (New), and configure the required billing account. Set usage quotas and budget alerts suitable for your launch.

Create **two separate keys**:

1. Android map key: restrict application usage to `app.hometayo.mobile` and the SHA-1 fingerprint of the **existing EAS signing keystore**; restrict APIs to Maps SDK for Android. Configure as `GOOGLE_MAPS_ANDROID_API_KEY` in the Expo/EAS environment. This key is embedded in Android by design; its package/certificate restrictions protect its use.
2. Server Places key: restrict APIs to Places API (New), keep it only in Vercel as `GOOGLE_PLACES_API_KEY`. Do not put it in an `EXPO_PUBLIC_` variable. Destination searches require a signed-in native user and are limited to 30 per account per hour.

No key was created during implementation. Without the Android map key, the app shows Map setup pending while listing/location sorting remains available. Without the server key, it explains destination search is awaiting setup. Current-location permission is requested only when the renter presses Use my location; no background tracking is enabled.

Official setup: https://docs.expo.dev/versions/latest/sdk/map-view/

## 3. Google sign-in inside Android

Create/register an Android OAuth client with package `app.hometayo.mobile` and the same EAS signing SHA-1. Use the existing Google **Web** OAuth client ID for both backend `AUTH_GOOGLE_ID` and app `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID`. Never put the Web client secret in the APK.

The backend verifies Google's signed ID token using google-auth-library and the expected audience before creating a native session. Existing Google/email identities remain separate; accounts with the same email are not silently linked.

Official Expo plugin setup: https://react-native-google-signin.github.io/docs/setting-up/expo

## 4. Link the existing EAS project and build once

From `apps/mobile`, log in to the existing Expo account and link the existing **hometayo-native** project:

```powershell
npx eas-cli login
npx eas-cli init
npx eas-cli update:configure
```

Select the existing project rather than creating another one. Its UUID can be set as `EAS_PROJECT_ID`; app.config.ts also reads the project ID written into app.json by EAS setup.

Configure the Expo/EAS **preview** environment with:

```dotenv
EXPO_PUBLIC_API_URL=https://hometayoph.vercel.app
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=<same Google Web client ID>
GOOGLE_MAPS_ANDROID_API_KEY=<restricted Android Maps key>
EAS_PROJECT_ID=<existing Expo project UUID>
```

Use plain/sensitive visibility as appropriate for these app identifiers and the embedded Android key so the CLI can read the same config for builds and updates. Keep actual backend secrets out of this environment. Set the same configuration for production when using that channel.

Build using the existing signing key:

```powershell
npx eas-cli build --platform android --profile preview
```

Version 0.2.0 / Android versionCode 3 adds the native map, location, Google sign-in, SecureStore and update modules. Install this APK once and verify it on a real Android phone. Retain the existing EAS project, package name and keystore. Then update the published APK URL in `app/download/page.tsx` to the new signed APK's direct download link and deploy the website.

## 5. Publish compatible updates later

After testing your code, from `apps/mobile`:

```powershell
npx eas-cli update --channel preview --environment preview --message "Describe the update"
```

Users press **Update app**, download the compatible update, and confirm Restart now. Preview and production builds have separate channels. Fingerprint runtime policy prevents incompatible native updates from being delivered. Native dependencies, permissions or native configuration changes need a new APK; pure interface/JavaScript changes can use EAS Update when the runtime matches. An old APK without expo-updates cannot gain this capability through a website change.

Official update behavior: https://docs.expo.dev/versions/latest/sdk/updates/

## Verification and remaining release checks

Implementation checks: TypeScript, native Android bundle export, API fail-closed tests, local PostgreSQL migration/session/owner-permission tests, and geographic ranking tests. No production migration, provider configuration, paid API request, signed APK build or deployment was performed.

Before release, verify email delivery/code expiry and rate limiting; valid/invalid Google sign-in; session restoration/logout; renter/owner choice; another owner's pin cannot be changed; denied location permission; map rendering and source attribution; all-city and nearest-destination search with real owner-provided pins; and one published EAS Update on a real phone. Dependency audits currently report unresolved vulnerabilities; investigate applicable findings before public launch. Native owner editing beyond map pins, photo uploads and road-route/travel-time calculations remain outside this release.
