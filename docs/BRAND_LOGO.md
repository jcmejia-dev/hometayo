# HomeTayo connected-homes logo

The approved logo is the cream and sage connected-homes artwork supplied on 2026-10-16.

- `public/brand-logo.png`: web metadata image source, 512 square.
- `public/icon.svg`: self-contained raster wrapper used by existing web brand placements and favicon links.
- `apps/mobile/assets/icon.png`: native app and in-app brand image, 1024 square.
- `apps/mobile/assets/adaptive-icon.png`: Android launcher foreground with extra safe-area padding.

The brand artwork keeps its original colors across themes. UI text, controls and surfaces continue to follow the selected theme.

Android version code is now 4. A launcher-icon change requires a new APK; OTA updates cannot change the installed launcher icon. From the repository root:

```powershell
git pull --ff-only origin main
cd apps\mobile
npx eas-cli build --platform android --profile preview-maps
```

Keep the existing EAS signing credentials and preview environment variables, including the Maps key and Google Web Client ID. Install the resulting APK as an update to preserve the account and app data.
