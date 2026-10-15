# Android download

The website's `/download` page links directly to the published Expo standalone APK. Visitors do not need to open an Expo build page or install a PWA.

The current release URL is tracked in `app/download/page.tsx`. Update that URL and deploy the website when publishing a replacement APK. `ANDROID_APK_URL` is no longer used, so a stale Vercel setting cannot keep serving an older build.

Android requires visitors to open the downloaded file and confirm installation. Verify a replacement APK on a phone before release. This website change does not build or sign an app.
