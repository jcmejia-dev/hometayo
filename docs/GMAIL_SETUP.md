# HomeTayo Gmail setup

HomeTayo can send web verification links, native six-digit verification codes, and password-reset links through Gmail. No custom sending domain or Resend account is needed for this provider. Your website remains on `hometayoph.vercel.app`.

## Gmail account

1. Use a dedicated Gmail account for HomeTayo emails.
2. Enable [2-Step Verification](https://myaccount.google.com/security).
3. Open [App passwords](https://myaccount.google.com/apppasswords), create one named HomeTayo, and save it privately. This is not your normal Gmail password. [Google explains account eligibility and app passwords](https://support.google.com/accounts/answer/185833).

## Backend settings

In Vercel → HomeTayo → Settings → Environment Variables, add:

```dotenv
AUTH_EMAIL_PROVIDER=gmail
GMAIL_USER=your-dedicated-account@gmail.com
GMAIL_APP_PASSWORD=your-16-character-app-password
APP_BASE_URL=https://hometayoph.vercel.app
ENABLE_NATIVE_AUTH=true
ENABLE_EMAIL_PASSWORD_AUTH=true
ENABLE_EMAIL_SIGNUP=true
```

Keep the existing `DATABASE_URL` and `AUTH_SECRET`. Use the same settings in the root ignored `.env.local` for local backend tests. The example placeholders above must be replaced; spaces shown by Google in the app password are accepted and stripped internally. Gmail messages always send as `HomeTayo <GMAIL_USER>`; `AUTH_EMAIL_FROM` and `RESEND_API_KEY` are not required in Gmail mode.

Do not put `GMAIL_APP_PASSWORD` in `apps/mobile`, an `EXPO_PUBLIC_` variable, a commit, or a chat message. Redeploy the backend after changing Vercel settings.

## Database and account test

Authentication still needs migrations 001–004. Confirm the intended database and backup/restore point, then authorize/run `npm run db:migrate` from the repository root if needed. No migration was run as part of this change.

After configuration and deployment, `/api/mobile/auth/status` should report email sign-in/sign-up as enabled. These booleans check configuration only; test actual delivery too:

1. Expo Go → Profile → Create account. Enter an email you control and a password of at least 12 characters.
2. Check your inbox/spam for the six-digit verification code, verify, then sign in.
3. On the website, test registration/verification and Forgot password with your own account.

Gmail can apply sending limits or block unfamiliar server logins. App-password availability depends on Google account settings. See [Nodemailer's Gmail guidance](https://nodemailer.com/usage/using-gmail/) if delivery fails. This is suitable for initial small-volume use, not a guarantee of delivery or unlimited sending.

Google sign-in is a separate feature and does not use these Gmail email credentials. Its Expo Go limitation is unchanged.

## Verification for this change

Automated tests mock SMTP; they do not send real emails. No Gmail credential was supplied, no real delivery was verified, and no production configuration or database was changed.
