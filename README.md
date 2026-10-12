# HomeTayo

**Hanap bahay. Dito tayo.** A mobile-first Philippine rental discovery platform, starting with Koronadal City.

> **Development preview:** The current application is the first UI scaffold. It does not connect to a database, store rental requests, accept landlord registrations, publish live property listings, process payments, or deliver notifications. The app is not deployed.

## Technology
- Next.js App Router, React, TypeScript, Tailwind CSS
- Installable-PWA foundations: web manifest and vector app icon; service worker, raster icons and offline/update behavior will be implemented and device-tested later
- Playwright Test E2E smoke tests and optional Playwright CLI inspection
- Planned later: Neon PostgreSQL + Drizzle; Google OAuth; owner moderation + uploads

## Local quick start (Node 20.9+ recommended, Node 24 tested by developer tool setup)

~~~powershell
git pull origin main
npm install
npm run dev
~~~

Open http://localhost:3000. When testing a PR branch, check it out by name first rather than blindly pulling main:

~~~powershell
git fetch origin
git switch feat/job-1-app-foundation
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

## Scope and safety
- Filters navigate to shareable URL query parameters.
- No fake sample homes are shown as live listings.
- Rental request and owner pages are informative previews until secure backend flows are implemented.
- Use a non-commercial prototype hosting arrangement; commercial operation requires hosting and legal review.
- Keep sensitive credentials in ignored .env.local; never send or commit them.

## Project documentation
- [Product blueprint](docs/PRODUCT_BLUEPRINT.md)
- [Agent instructions](AGENTS.md)
- [Development tooling](docs/DEV_TOOLING.md)
- [Tool connections](docs/TOOL_CONNECTIONS.md)

Create pull requests for each milestone and report tested/not-tested status explicitly.
