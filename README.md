# HomeTayo

**Hanap bahay. Dito tayo.** A mobile-first Philippine rental discovery platform, starting with Koronadal City.

> **Development preview:** Job 2 adds an optional Neon-backed, read-only view of admin-approved real listings. Database connection and migrations require separate user setup. Job 3 adds Google OAuth and landlord submission/moderation when private credentials are configured; photo uploads, listing edits, payments, rental requests and notifications are not yet available. The application is not deployed.

## Technology
- Next.js App Router, React, TypeScript, Tailwind CSS
- Installable-PWA foundations: web manifest and vector app icon; service worker, raster icons and offline/update behavior will be implemented and device-tested later
- Playwright Test E2E smoke tests and optional Playwright CLI inspection
- Job 2: Neon PostgreSQL + Drizzle read-only public listings and explicit SQL migration runner (requires DATABASE_URL)
- Job 3 (optional setup): Google OAuth, owner submission dashboard, role-protected review queue
- Planned later: photo uploads, property edits, account deletion, alerts

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
- Rental request and owner pages are informative previews until secure backend flows are implemented.
- Use a non-commercial prototype hosting arrangement; commercial operation requires hosting and legal review.
- Keep sensitive credentials in ignored .env.local; never send or commit them.

## Project documentation
- [Product blueprint](docs/PRODUCT_BLUEPRINT.md)
- [Agent instructions](AGENTS.md)
- [Development tooling](docs/DEV_TOOLING.md)
- [Tool connections](docs/TOOL_CONNECTIONS.md)

Create pull requests for each milestone and report tested/not-tested status explicitly.
