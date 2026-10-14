# Test HomeTayo using a QR code

HomeTayo's Google sign-in and native modules require a custom development app. Expo Go cannot run this project. Install the development APK once; it provides the QR launcher and live UI updates from your computer.

## First setup

```powershell
cd C:\Users\pc\hometayo
git pull --ff-only origin main
cd apps\mobile
npm ci
npx eas-cli login
npx eas-cli init
npx eas-cli build --platform android --profile development
```

If EAS prompts to link a project, select the existing hometayo-native project. Keep existing signing credentials. Open the finished EAS build page on your phone and install the development APK. EAS builds in the cloud, so Android Studio is not needed for this path.

## Every test session

```powershell
cd C:\Users\pc\hometayo\apps\mobile
npm run start:qr
```

Keep the PC and phone on the same Wi-Fi. Open HomeTayo's development app and use Scan QR code on its launcher to scan the terminal QR code. Keep the terminal open. JavaScript/UI edits reload through Metro; native module/config changes require a new development build.

If the Wi-Fi connection is blocked, stop Metro and run:

```powershell
npx expo start --dev-client --tunnel
```

Expo may ask to install its tunnel helper. The tunnel is for Metro, not your local backend. By default the app uses the deployed HomeTayo backend. Native login, Maps and destination search still require the configuration described in NATIVE_AUTH_MAPS_UPDATES.md. In development builds the Update app button is not the production EAS Update test; test that separately in a signed preview build.
