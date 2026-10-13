# HomeTayo

**Hanap bahay. Dito tayo.** A mobile-first Philippine rental discovery platform, starting with Koronadal City.

> **Development preview:** Job 2 adds an optional Neon-backed, read-only view of admin-approved real listings. Database connection and migrations require separate user setup. Job 3 adds Google OAuth and landlord submission/moderation when private credentials are configured; photo uploads, listing edits, payments, rental requests and notifications are not yet available. The application is not deployed.

## HomeTayo brand icon

- The app name stays **HomeTayo**. The *HomePin* house-and-location-pin symbol is the visual mark, not a rename.
- The same forest-green / ivory / gold vector appears as the site header/footer mark and the scalable SVG favicon.
- 192px and 512px PWA PNG icon routes, a maskable 512px version and Apple touch icon are generated with Next.js ImageResponse. They require no external image hosting.
- Icons are referenced in the PWA manifest and metadata. Users with an already-installed version may need to refresh/reinstall if their OS caches the previous launcher icon.

## Homepage design (UI refresh)
- Replaced decorative house artwork with a **clearly labeled illustrative interface** and demo rental cards. No demo properties are linked or published as real inventory.
- Sample photos are licensed under the Unsplash free license; the images are hosted remotely by Unsplash and may be unavailable when offline. Credits: [Eli Chamoun](https://unsplash.com/photos/a-modern-house-with-a-stylish-exterior-coqmBSuXOE4) and [Caroline Badran](https://unsplash.com/photos/a-modern-bedroom-shows-a-cozy-bed-YktL-k8ErB8).
- Search dropdowns now use accessible Radix UI Select menus with keyboard/touch support and preserve the original URL query semantics.
- Marketing demonstration prices and photographs are **illustrative only** and must not be mistaken for approved HomeTayo listings. Remove sample previews when live listing imagery is implemented, or explicitly maintain their preview status.

## Job 4 profile and admin operations

- Google-authenticated Profile & Settings (`/profile`) stores renter preferences.
- Admin operations (`/admin`) displays actual account/listing counts, moderation queue and a scoped event log.
- **Required**: Apply `002_profiles_admin_activity.sql` after updating your existing dedicated HomeTayo Neon DB. This upgrade is not run automatically on GitHub or Vercel.
- [Migration and verification guide](docs/PROFILE_ADMIN_SETUP.md). The activity timeline tracks listing operations, **not** page views or private renter behavior.

## Technology
- Next.js App Router, React, TypeScript, Tailwind CSS
- Installable-PWA foundations: web manifest and vector app icon; service worker, raster icons and offline/update behavior will be implemented and device-tested later
- Playwright Test E2E smoke tests and optional Playwright CLI inspection
- Job 2: Neon PostgreSQL + Drizzle read-only public listings and explicit SQL migration runner (requires DATABASE_URL)
- Job 3 (optional setup): Google OAuth, owner submission dashboard, role-protected review queue
- Planned later: photo uploads, property edits, account deletion, alerts

## Renter and owner instructions

The public **[How HomeTayo works](/how-it-works)** page provides role-specific step-by-step guidance. Owner dashboard, rental search and property submission screens include contextual guide links. Guides describe only features that already exist and distinguish planned capabilities.

## Local quick start (Node 20.9+ recommended, Node 24 tested by developer tool setup)

~~~powershell
git pull origin main
npm install
npm run dev
~~~

Open http://localhost:3000. When testing a PR branch, check it out by name first rather than blindly pulling main:

~~~powershell
git fetch origin
git switch feat/job-3-google-auth-owner-mvp
npm install
npm run dev
~~~

## Verify
~~~powershell
npm run typecheck
npm run lint
npm run build
npx playwright install chromium
npm run test:e2e
~~~

**Verified in GitHub Actions (PR #4, 2026-10-12):** ESLint, TypeScript checks, production build and Playwright Chromium desktop/mobile smoke tests passed. Local Windows runtime, Android PWA installability, offline support and device-specific behavior remain **unverified**. Playwright CLI was installed on the developer's Windows machine separately.

## Google OAuth and landlord submissions

Follow [Google OAuth local setup](docs/GOOGLE_OAUTH_SETUP.md) to enable private sign-in and submit genuine rentals for admin review. The app continues showing prelaunch screens when credentials are absent. No live OAuth has been verified in CI.

## Neon setup\n\nFollow [dedicated HomeTayo Neon development setup](docs/NEON_SETUP.md). Do not run migrations against Lakbay or a production database.\n\n## Scope and safety
- Filters navigate to shareable URL query parameters.
- No fake sample homes are shown as live listings. Only approved records are displayed when the user configures their own HomeTayo database.
- Rental requests remain a preview, but authenticated owners can submit genuine listings for admin review when Google OAuth and Neon are configured.
- Use a non-commercial prototype hosting arrangement; commercial operation requires hosting and legal review.
- Keep sensitive credentials in ignored .env.local; never send or commit them.

## Project documentation
- [Product blueprint](docs/PRODUCT_BLUEPRINT.md)
- [Agent instructions](AGENTS.md)
- [Development tooling](docs/DEV_TOOLING.md)
- [Tool connections](docs/TOOL_CONNECTIONS.md)

Create pull requests for each milestone and report tested/not-tested status explicitly.
