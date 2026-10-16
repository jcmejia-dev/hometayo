# Enable HomeTayo maps

The installed APK was built without an Android Maps key. Destination search also needs a separate server Places key. A JavaScript update cannot add the Android manifest key to an already-installed APK.

## Google Cloud

1. Select the HomeTayo project and link a billing account.
2. Enable **Maps SDK for Android** and **Places API (New)**.
3. Create a key named HomeTayo Android Maps. Set application restrictions to **Android apps**:
   - Package: `app.hometayo.mobile`
   - Existing EAS signing SHA-1: `1E:A3:ED:47:3F:3B:DF:87:98:1A:73:07:74:24:D2:3E:EF:C0:9C:05`
   - API restrictions: **Maps SDK for Android** only.
   This fingerprint was verified from the existing signed APK. Keep the existing EAS keystore; if the signing certificate changes, obtain its new fingerprint before restricting the key.
4. Create a separate server key restricted to **Places API (New)**. Do not give the server key an Android application restriction, and do not put it in the app or an EXPO_PUBLIC_ variable. Configure supported server restrictions for your hosting environment.

## Expo and Vercel

In Expo, select the existing **hometayo-native** project and create `GOOGLE_MAPS_ANDROID_API_KEY` in the **preview** environment, using **Sensitive** visibility so EAS can evaluate the same app configuration locally and on its build servers.

Keep `EXPO_PUBLIC_API_URL` and `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` configured there as well. The latter must match Vercel AUTH_GOOGLE_ID. These identifiers belong to the app; backend credentials do not.

In Vercel, select the project serving hometayoph.vercel.app. Add `GOOGLE_PLACES_API_KEY` to Production (and Preview if you test preview deployments), then redeploy. This key is read only by the server search route.

Never paste either key into chat or commit it to Git.

## Build once after setup

```powershell
cd C:\Users\pc\hometayo
git pull --ff-only origin main
cd apps\mobile
npx eas-cli build --platform android --profile preview-maps
```

The preview-maps profile fails clearly if the Android key is missing. Use the existing signing keystore. Download and install the resulting APK over the existing app, then update the website download URL to the new artifact. Existing APKs still lack the native map key, even after a JavaScript update.

Test: open Explore, allow foreground location when requested, confirm the map tiles load, search `KCC Mall, Koronadal`, select a result, and inspect nearby rentals. Empty results can be legitimate when no approved, pinned rentals match the chosen radius and budget. Distances are straight-line estimates.

## Official references

- https://developers.google.com/maps/documentation/android-sdk/get-api-key
- https://developers.google.com/maps/documentation/places/web-service/get-api-key
- https://developers.google.com/maps/api-security-best-practices
- https://docs.expo.dev/eas/environment-variables/
