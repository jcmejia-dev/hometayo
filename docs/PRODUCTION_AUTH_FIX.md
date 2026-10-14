# HomeTayo production sign-in

## Google error 400: redirect_uri_mismatch

In Google Cloud → Google Auth Platform → Clients, edit the Web application OAuth client whose ID is set as AUTH_GOOGLE_ID in Vercel. Add:

- Authorized JavaScript origin: `https://hometayoph.vercel.app`
- Authorized redirect URI: `https://hometayoph.vercel.app/api/auth/callback/google`

Do not replace the callback with the home or sign-in page. Google returns to the Auth.js callback first; Auth.js then redirects the signed-in user to `/`.

If error details show a different redirect_uri, register the exact trusted hostname being used or correct AUTH_URL in Vercel to the canonical production origin. Preview domains require their own registered callback if OAuth is tested on them. Keep localhost entries for local development. Never share OAuth secrets.

## Disabled email forms

Email code exists but stays disabled until configuration is ready. Follow EMAIL_AUTH_DEPLOYMENT.md: apply migration 003 to the intended HomeTayo database, configure verified Resend delivery, then enable the auth/signup flags. Use APP_BASE_URL=https://hometayoph.vercel.app for the deployment shown in the screenshots. Configuring an APK download URL has no effect on authentication.

## Welcome and login flow

First-time guests see the introduction, then Create account / Sign in / Explore as guest. Returning guests can replay it using Discover HomeTayo. Successful Google and email sign-in return to the rental home page. Authenticated visitors skip the automatic introduction but may explicitly replay it. Property management remains available through List your property.

The existing standalone native APK uses browser authentication links. A logged-in website session does not create a native app session; native authentication requires a separate implementation and new app release.
