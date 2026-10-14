# Test HomeTayo using a QR code

## Preview first in Expo Go (no APK build)

```powershell
cd C:\Users\pc\hometayo\apps\mobile
npm run start:go
```

Use Expo Go's Scan QR code on your phone, with the phone and PC on the same Wi-Fi. Update Expo Go to a version supporting SDK 57. This preview supports the intro, native UI, guest browsing, included map/location modules, and configured email authentication. Google native sign-in and production EAS updates are unavailable in Expo Go; the app explains those limits instead of loading unsupported native modules. Email sign-in and destination search still require the backend settings.

If the LAN QR does not connect, run `npx expo start --go --tunnel` instead. Expo may ask to install a tunnel helper.

## Full native testing later

Install the custom development APK when you are ready to test Google native sign-in. It provides its own QR launcher and live UI updates from your computer.

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
