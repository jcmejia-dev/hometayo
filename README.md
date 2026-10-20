# HomeTayo

**Hanap bahay. Dito tayo.**

HomeTayo is a mobile-first Philippine rental marketplace built to make local property discovery, owner listings, renter accounts, and rental workflows easier to manage across web and Android.

## Try HomeTayo

| Platform | Link |
| --- | --- |
| 🌐 **Web App** | **https://hometayoph.vercel.app/** |
| 📱 **Android APK** | **https://github.com/jcmejia-dev/hometayo/releases/download/android-latest/HomeTayo.apk** |
| 📦 **Latest Android Release** | https://github.com/jcmejia-dev/hometayo/releases/tag/android-latest |

> **Android note:** The APK is distributed directly through GitHub Releases. Android may ask you to allow installation from your browser or file manager because this is not a Play Store release.

## What I built

HomeTayo is designed as a practical rental platform for the Philippine market, starting with Koronadal City. The project combines a responsive Next.js web application, PostgreSQL-backed application data, authentication and account flows, owner/admin workflows, PWA capabilities, and an Android distribution build.

### Core areas

- Mobile-first property discovery and rental browsing
- Renter and property-owner account experiences
- Owner property submission workflows
- Admin listing review and moderation
- Profile and renter-preference management
- Shareable search/filter URLs
- PostgreSQL-backed application data through Neon
- Google OAuth and email/password authentication infrastructure
- PWA manifest, icons, and mobile-oriented UX
- Android APK distribution through GitHub Releases
- Automated lint, TypeScript, build, and browser-testing workflows

## Technology

- **Next.js App Router**
- **React**
- **TypeScript**
- **Tailwind CSS**
- **Neon PostgreSQL**
- **Drizzle / SQL migrations**
- **Google OAuth**
- **Progressive Web App foundations**
- **Playwright**
- **GitHub Actions**
- **Vercel**

## Live deployments

### Web app

The public HomeTayo web application is available at:

**https://hometayoph.vercel.app/**

This is the fastest way for recruiters and reviewers to explore the current interface without installing anything.

### Android app

The latest public Android preview is published through GitHub Releases:

**[Download HomeTayo.apk](https://github.com/jcmejia-dev/hometayo/releases/download/android-latest/HomeTayo.apk)**

Release channel: [`android-latest`](https://github.com/jcmejia-dev/hometayo/releases/tag/android-latest)

The Android package is a preview build intended for portfolio and testing use rather than Play Store distribution.

## Product flow

HomeTayo is built around the actual rental journey rather than being only a property-card UI:

1. Renters discover available properties.
2. Owners manage and submit rental listings.
3. Listings pass through controlled moderation before publication.
4. User profiles and preferences support a more personalized rental experience.
5. Web/PWA and Android access let the same product experience reach desktop and mobile users.

The project is actively developed, so broader marketplace capabilities may continue to evolve.

## Authentication

The project contains responsive sign-in and sign-up experiences and supports Google OAuth infrastructure. Email/password deployment requires the configured transactional-email and database setup documented in:

- [Email authentication deployment guide](docs/EMAIL_AUTH_DEPLOYMENT.md)
- [Google OAuth setup](docs/GOOGLE_OAUTH_SETUP.md)

Private credentials belong in environment variables and are never committed to the repository.

## Data and admin operations

HomeTayo uses a dedicated PostgreSQL database for application data. Admin tooling includes listing moderation and operational views, while profile functionality stores renter-facing preferences.

Setup and migration documentation:

- [Neon development setup](docs/NEON_SETUP.md)
- [Profile and admin setup](docs/PROFILE_ADMIN_SETUP.md)

## HomeTayo identity

The product name remains **HomeTayo**. The HomePin symbol combines a house and location-pin concept and is used across the site's visual identity, PWA assets, and mobile presentation.

## Local development

Node.js 20.9+ is recommended.

```powershell
git clone https://github.com/jcmejia-dev/hometayo.git
cd hometayo
npm install
npm run dev
```

Open:

```text
http://localhost:3000
```

Environment-dependent features such as authentication and database-backed listings require the corresponding local environment variables and migrations.

## Verification

Useful project checks include:

```powershell
npm run typecheck
npm run lint
npm run build
npx playwright install chromium
npm run test:e2e
```

The repository uses automated checks to catch TypeScript, lint, build, and browser-regression issues as the product evolves.

## Project documentation

- [Product blueprint](docs/PRODUCT_BLUEPRINT.md)
- [Development tooling](docs/DEV_TOOLING.md)
- [Tool connections](docs/TOOL_CONNECTIONS.md)
- [Agent instructions](AGENTS.md)

## Links

- **Source code:** https://github.com/jcmejia-dev/hometayo
- **Web app:** https://hometayoph.vercel.app/
- **Android APK:** https://github.com/jcmejia-dev/hometayo/releases/download/android-latest/HomeTayo.apk
- **Android release page:** https://github.com/jcmejia-dev/hometayo/releases/tag/android-latest
- **Developer portfolio:** https://jcmejia.vercel.app/

---

Built and maintained by **Jamie Cristian A. Mejia**.