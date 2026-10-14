# Android download

The website's `/download` page provides a standalone APK download, not a PWA install prompt.

Publish a signed Expo standalone APK, verify it on an Android device, then set `ANDROID_APK_URL` to its public HTTPS download URL in the website environment. Redeploy the website after configuration. An AAB, Expo Go link or EAS development-client build is not a standalone APK release.

Without a valid HTTPS URL, the page shows an honest coming-soon message and offers web rental browsing. The website cannot silently install an APK: Android requires the visitor to open the downloaded file and confirm installation.

Native source is currently proposed in PR #18. This website change does not build, sign or publish that app. Verify current native feature limitations before releasing it.
