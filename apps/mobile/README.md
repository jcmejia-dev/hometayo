# HomeTayo Native — Android (React Native + Expo)

## Updated welcome design (0.1.1)

The native app has its own full-screen introduction: what HomeTayo does, rental discovery, and property-owner submissions. Continue leads to Create account / Sign in, then renter / property-owner selection. Authentication opens the canonical https://hometayoph.vercel.app website with the chosen audience. It does not create a native authenticated session. Returning visitors see account entry with About HomeTayo replay and public guest browsing.

Rebuild the standalone preview APK and install it to receive these changes. The already-published APK is unchanged. Android versionCode is 2; retain the same EAS project and signing key when rebuilding. Public API defaults to the canonical HomeTayo domain.

This is a real React Native app, NOT a WebView, PWA wrapper, or shortcut. Android UI uses native controls and fetches genuine, published rental records from HomeTayo's Vercel backend.

## Implemented

- First-launch native introduction: three screens, Continue, Create Account / Sign In, renter/property-owner choice, and Explore as Guest.
- Completion stored locally using AsyncStorage; replay option on native Home.
- Native Home, Explore, My Listings, Profile navigation tabs, and hardware-back handling.
- Guest city/property-type search, approved rental cards, detail screen, monthly prices, and safe public contact links.
- Loading, empty, retry and unavailable states. Never presents fake rentals.

## Not yet implemented
Native authenticated sign-in, OAuth token handoff, owner property writes, saved profile preferences, images, payments, native push notifications and offline modes. Sign In, Create Account and owner actions currently open the **real HomeTayo website in the system browser**, clearly labeled in the app. This does NOT grant the native app a logged-in session. Do not claim full parity or native login yet.

## Development

Use Node 22.13 or newer (Expo SDK 57). From repo root:

    cd apps\mobile
    npm install
    npx expo install --fix
    npm run check
    npx expo start

The only optional public env variable is EXPO_PUBLIC_API_URL=https://hometayo-snyn.vercel.app. Do NOT put DATABASE_URL, AUTH_SECRET, Google secrets or Resend tokens in Expo env files. The Next.js backend keeps Neon secrets on the server.

## Standalone signed Android APK (for testers)

    cd apps\mobile
    npm install
    npx eas-cli login
    npx eas-cli build:configure
    npx eas-cli build --platform android --profile preview

Use your own Expo account, set up signing credentials and link EAS project when prompted. The EAS preview profile produces an installable APK independently of Expo Go or the browser. EAS Build quota/fees may apply. Copy the completed build URL to your phone. This repository has NOT yet built or device-tested an APK.

For Google Play Store build an Android App Bundle via:

    npx eas-cli build --platform android --profile production

Publication also requires Google Play Console, signing, privacy policy, Android compliance, review and testing. The Google Play Store does not accept the preview APK as a production bundle.

## Data, updates and safety

Native React Native UI → HTTPS public Next.js API → Neon database (server-side). Listing API returns only published records, not accounts, admin roles or passwords. The website retains its own verified owner/admin permissions.

Future native account integration needs OAuth Authorization Code + PKCE, secure token exchange, deep-link callback and encrypted native token storage. Merely opening browser sign-in cannot authenticate the native UI.

To enable background JS updates, separately install/configure expo-updates, an EAS project ID and a compatible runtimeVersion before promising one-tap updates. Native code, permissions and icon changes require a new signed binary.

Re-run Android device checks and safety/privacy review before inviting public users.

## Optional CI-built testing APK

The GitHub Actions workflow Android native APK preview also builds a standalone React Native APK from source, with a temporary **debug signing certificate**. It uploads the artifact under the Actions run for internal testers. This is not an app-store release and is not a replacement for properly managed EAS signing credentials. Build success is not guaranteed until the workflow finishes green and a real Android device has installed the APK.
