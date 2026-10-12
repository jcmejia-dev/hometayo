# HomeTayo — Product and Engineering Blueprint v1.0

**Status:** Proposed product specification, not implemented  
**Date:** 2026-10-12  
**Repository:** https://github.com/jcmejia-dev/hometayo  
**Initial market:** Koronadal City, South Cotabato, Philippines  
**Tagline (working):** Hanap bahay. Dito tayo.  
**Primary delivery:** Responsive web application and installable Progressive Web App (PWA)

> This document is the agreed *planning baseline*, not evidence of built features, activated payments, customer demand, legal clearance, or production readiness. Product name, prices, providers, and timing remain subject to validation. Record changes through versioned decisions instead of quietly expanding MVP scope.

## 1. Executive summary

HomeTayo is a Philippines-first rental discovery and property management platform for affordable family houses, apartments, boarding houses, dormitories, and bedspaces. It solves two connected problems: renters cannot easily discover trustworthy, available, appropriately priced properties; small property owners lack simple ways to showcase vacancies and organize inquiries.

**Positioning:** Search without the Facebook-post chaos; list without needing a website or technical skills.

**Go-to-market:** Seed real, authorized landlord inventory in Koronadal before driving renter traffic. Let landlords keep their existing Facebook posts while giving them a shareable professional listing. If a renter finds no results, offer an opt-in rental request and saved-search alert. Do not fabricate inventory, demand numbers, reviews, or verification statuses.

**Business architecture:** Consumer rental marketplace + optional paid owner software / custom websites. Browsing stays free. First revenue may come from custom website services, not platform subscriptions.

**Narrow MVP:** Public discovery, strong filters, listing detail pages, landlord onboarding, owner submissions, admin moderation, favorites, rental requests, availability confirmations, direct contact, and a PWA. Avoid booking payments, escrow, commissions, AI assistants, native chat, and complicated rent accounting in the first release.

## 2. Goals, non-goals, success measures

### Product goals
1. A renter can discover accurate locally relevant listings within 30 seconds, or file a rental request when none match.
2. A first-time owner can request help publishing or self-submit a listing in under 10 minutes if photos/details are ready.
3. Every published listing has clear rent, location granularity, property type, availability status, last-confirmed date, and a legitimate contact route.
4. Admins can review, edit with audit trails, unpublish, and handle scam/fraud reports.
5. The experience works on budget Android devices and modest/mobile network connections.

### Business goals
1. Validate that at least 10 distinct property owners will allow authorized listings.
2. Recruit 20–30 genuine listings in Koronadal before wider consumer promotion.
3. Measure real inquiry events, freshness, renter request conversion, and landlord response feedback.
4. Interview owners about paid vacancy/room management and custom website services before integrating paid checkout.

### Explicit non-goals for MVP
- No property booking / down-payment handling / renter-to-owner fund transfer.
- No claim that HomeTayo is a licensed broker, guarantor, appraiser, or property inspector.
- No automatic importing/scraping listings or photos from Facebook without express permission.
- No AI-generated or fictional property inventory, ratings, or inquiries.
- No native Android APK as a launch requirement; installable PWA first.
- No required login for browsing or contact methods that owners make public.
- No promise that browsers can issue push notifications reliably on all devices while the app is closed.

### North-star metric and leading indicators
- North-star: **qualified owner contact actions per active, verified listing per month**, with follow-up interviews to assess actual value.
- Supply: real owner count, approved listings, active/fresh listings, % refreshed in last 14 days.
- Demand: search-to-detail CTR, successful search rate, zero-results rate, submitted rental requests.
- Trust: report rate, removal response time, duplicate/fake listing rate.
- Monetization (later): owner willingness to pay, paid conversion, paid retention, net revenue after fees/costs.

## 3. Personas and permissions

**Guest renter:** Browse, filter, open listings, view approximate location, use allowed direct contact links, and submit a verified guest rental request if enabled. No forced signup.

**Registered renter:** All guest actions plus favorites, saved searches, rental requests, notification preferences, and report tracking.

**Landlord / listing owner:** Maintain owner profile, create/edit own listing drafts, submit for review, mark unavailable, reconfirm availability, view legitimate inquiry click analytics, and manage only assets they own.

**Admin / moderator:** Review submissions, approve or reject, handle reports and takedowns, inspect audit logs, manage listing ownership claims and abuse. Keep the number of admins minimal. Record every privileged action.

**Property manager (phase 2):** Delegated access to authorized multiple buildings/rooms, with explicit organization membership and scoped permissions.

A person may be both renter and landlord. Roles and resource ownership are checked **on the server**, not merely hidden in the UI.

## 4. Core workflows and product requirements

### 4.1 Renter journey
1. Open home page, see Koronadal as initial region but allow location editing.
2. Enter city/barangay or choose a recent place. Default property-type switcher: House, Apartment, Boarding house, Dorm/bedspace.
3. Filter by monthly rent range in PHP, bedrooms (for whole-unit rentals), occupancy/beds (for shared stays), bathrooms, available now, pet-friendly, parking, furnished, and selected amenities.
4. Results show image, price/month, rental category, barangay or approximate district, bed/bath count when relevant, last confirmed date, and availability tag. Users can choose list or map; list is the default.
5. Detail page explains expected monthly rent, deposits/advance terms if supplied, rules, utilities, photos, approx location, contact preference, and when owner last confirmed details.
6. Contact through owner-approved Messenger / phone / external contact route. Never invent or infer a phone number. Explain that HomeTayo does not collect payments on behalf of owners.
7. Save favorite or report the listing. Ask to sign in only for persistent features.
8. If no match, allow creation of an opt-in rental request, with optional email alerts and a way to unsubscribe.

### 4.2 Empty marketplace journey
- Show honest empty-results message, adjustable filters, and a prominent “Tell us what you need” rental request.
- Collect location, property type, price ceiling, minimum bedrooms/bed capacity, desired move-in time, and contact email.
- Verify guest email before alerts; do not publish a renter's identity or contact information.
- Admin and owners see only aggregate sufficiently sized demand (e.g., request-count ranges, not raw personal profiles).
- Trigger matches when new approved relevant listings are published. In-app alert at MVP; email/push only after permission and working delivery infrastructure.

### 4.3 Landlord journey
1. Choose self-service or free assisted listing creation; owners may keep advertising on Facebook.
2. Authenticate with Google for self-service. Record acceptance of posting rules and contact visibility choices.
3. Enter property type, title, description, barangay/city, approximate map pin, monthly price, bedrooms/beds/bathrooms as applicable, features, rent terms, photos, availability, and public contact mode.
4. Save as draft, preview, then submit for review. Do not auto-publish new owners without fraud controls.
5. Admin approves/rejects with a reason. Owners receive visible status and can revise rejected entries.
6. Owner can edit, pause, mark occupied, or remove a listing. Material edits to address/price/contact details return to moderation when appropriate.
7. Reconfirm availability roughly every 14 days; after ~30 days unconfirmed, display stale notice or temporarily hide according to a documented policy (tunable configuration).
8. Owner can share a clean SEO-friendly public URL in Facebook groups/Marketplace.
9. Offer optional migration into paid vacancy/room management later, only after demonstrated demand.

### 4.4 Assisted listing intake
- Admin may prepare a listing from details supplied by an owner, with explicit recorded permission and confirmation of what will be public.
- Source record: consent timestamp, contact method, approved public fields, staff account, and source category; do not store unauthorized scraped images.
- An owner may later claim the listing by proving control of the contact method or other appropriate authorized evidence.
- Single-use claim token, time-limited, never public or guessable.
- Ownership changes are audited; disputes freeze self-service editing until resolved.

### 4.5 Trust and moderation
- Clearly distinguish: “Owner provided”, “Owner-confirmed availability”, and “Identity/authority reviewed” only when each statement is substantiated. Avoid generic “Verified property” badges that imply physical inspection.
- Provide Report listing categories: fake property, misleading price, stolen photos, suspicious payment request, inaccurate availability, duplicate, harassment, other.
- Admin review queue, status history, report evidence, reversible unpublish, and appeals workflow.
- Safety message on public listing: avoid paying deposits before independent verification and understanding contractual terms.
- Prevent duplicate listings via soft signals (same owner, phone hash, approximate location, similar images); human review before punitive action.
- Contact/review operations require audit entries with actor and timestamp.

## 5. UI and interaction design

**Brand:** HomeTayo (provisional; trademark/domain not legally cleared). Friendly modern Philippine visual identity, not a luxury-only property website.

**Design tokens (proposed):**
- Forest green #173D32 (primary), sage #5D9B7C (support), ivory #F7F6F1 (base), warm gold #E8B778 (accent).
- Simple rounded geometric icon inspired by a doorway/roof; small mark must remain clear at 48 px.
- Rounded cards, clean typography, restrained animations (150–250 ms), generous tap areas.
- Use CSS-variable design tokens with light/dark support; accessibility contrast must be measured rather than assumed from palette alone.

**Mobile navigation:** Explore / Saved / Requests / Profile. Landlords get “My Listings” and “Add Property” under their account; dashboard can have distinct owner navigation. Admin gets a segregated admin shell.

**Main screen priorities:** Location search, useful filters, results, and saved request CTA — not ad slots. No splash animation that blocks access to listings. Avoid overcrowded maps.

**Key routes:**
- / — home and Koronadal landing
- /rentals — search with shareable query parameters
- /rentals/[slug] — property detail
- /requests/new — rental request form
- /saved — favorites and alerts (sign-in)
- /sign-in — authentication
- /owner — owner overview
- /owner/listings — owned listings
- /owner/listings/new — create wizard
- /owner/listings/[id]/edit — draft/editor
- /admin — role-guarded admin dashboard
- /admin/review, /admin/reports — moderation
- /privacy, /terms, /safety, /contact — trust/legal pages

**States:** Loading skeletons, no-results, offline, network error/retry, permission denied, sign-in required, listing unavailable, maintenance, out-of-date app.

**Accessibility:** Semantic elements, keyboard operation, visible focus, readable text at 320 px, descriptive image alt text, accessible dialogs, reduced-motion support, WCAG 2.2 AA as a target. English and Filipino copy initially, regional language localization later if validated.

**Images:** Real owner-authorized photographs only. Compress thumbnails and blur placeholder. Show descriptive “No photo provided” rather than a generated property photo presented as real.

## 6. Technical architecture

### Recommended stack
- Frontend/full-stack: **Next.js App Router + TypeScript**
- UI: **Tailwind CSS + accessible component primitives + Lucide icons**
- Validation: **Zod** shared domain schemas, repeated on server
- Persistence: **PostgreSQL (Neon) + Drizzle ORM + tracked SQL migrations**
- Authentication: **Auth.js with Google OAuth**, persisted secure HTTP-only session cookies and database adapter, with standard CSRF protections
- Image/media: **Vercel Blob** or compatible object storage, public only for listing pictures; private storage for sensitive administrative evidence
- Maps: **MapLibre + a properly licensed OSM-derived tiles/geocoding provider** (or no live map until provider configured). Do not assume free OSM public tile endpoints are unrestricted for production.
- Email notifications: transactional mail provider to be selected; opt-in with verified addresses and rate limits
- Observability: privacy-conscious structured server logs, error monitoring, minimal analytics
- Deployment: **Vercel** for prototyping; commercial hosting tier or alternative provider when monetizing
- PWA: web manifest, service worker, versioned cache strategy, install UX, update-ready notice, offline shell and last-viewed public pages as practical

### Simplified request architecture
Renter/Owner browser (Next.js UI / PWA)
-> HTTPS App Router Server Components, Server Actions and Route Handlers
-> authenticated authorization/service layer
-> Drizzle -> Neon PostgreSQL
-> object storage for approved property images
-> optional third-party map, email and payment systems.

No database credentials or provider secret keys are exposed to client bundles. Query results are filtered by status and visibility on the server.

### Service boundaries
- **Search:** public read-only published listing queries, pagination and caching.
- **Listing service:** owner-scoped CRUD, approval workflow, freshness policy.
- **Requests service:** renter demand records, match filtering, alerts.
- **Moderation:** admin-only decisions, abuse reports, immutable audit trail.
- **Billing (future):** separate integration module and billing tables; not required to browse.
- **Owner operations (future):** properties/buildings/units/tenants scoped per organization.

Prefer a modular monolith in a single repository for MVP; avoid microservices, Redis, vector search, and multiple external runtimes until measurable demand requires them.

### Search and performance
- Public pages server-rendered where appropriate for SEO; metadata, sitemap, canonical page, and city landing pages.
- Search parameters encoded in URL and validated on the server.
- Server pagination with a stable order; choose a bounded page size, initially 12–24.
- SQL indexes: published listings by status + location + price + last-confirmed; owner/status; unique slugs; saved search owner, and rental request match predicates.
- Use PostgreSQL full-text/trigram search only when necessary; for initial city/barangay filters, conventional btree indexing is enough.
- Optional PostGIS for real geospatial radius search only if supported by chosen plan and product demand.
- Performance targets on representative budget Android and throttled connection: LCP < 2.5 seconds when feasible, CLS < 0.1, INP < 200ms. Measure against realistic field data before asserting success.

### PWA and updates
- Installability: manifest with 192/512 icons, short name HomeTayo, standalone display mode, HTTPS.
- Cache first-party static shell and carefully selected *public* read-only responses; use network-first/stale-while-revalidate only where it won't misrepresent availability.
- Never cache authenticated private API responses or pages for offline display on shared devices.
- On new service worker available: show unobtrusive “Update available” banner, user-initiated activate/refresh; prevent lost unsaved form data.
- Background push is phase 2 and browser/device/permission dependent; do not market guaranteed closed-app push delivery.
- Daily reminder/match batching if using Vercel Hobby cron; its schedule is limited to approximately once daily and timing is imprecise.
- Test install, update, offline, stale listing and notification permissions on real Android devices.

### Hosting/commercial use warning
Vercel Hobby terms restrict deployments to personal non-commercial use. Before accepting revenue or operating a commercial production service, use Vercel Pro/Enterprise or an alternative host whose terms permit commercial use. Keep deployment scripts portable.

## 7. Data architecture

Use UUID primary keys, UTC timestamps in database, timezone-aware conversion to Asia/Manila for users, database foreign keys, CHECK constraints, and unique indexes. Prefer soft deletion for legally/audit-sensitive records and a retention/deletion policy for personal information.

### MVP tables

| Table | Important fields | Purpose |
|---|---|---|
| users | id, email unique, display_name, avatar_url, status, created_at | Account identity |
| auth_accounts / auth_sessions / verification_tokens | provider/account/session keys | Auth.js adapter tables |
| user_roles | user_id, role | renter, landlord, moderator, admin |
| owner_profiles | id, user_id, public_name, contact_prefs, verification_state | Owner public identity and settings |
| listings | id, owner_id, slug, type, status, title, description, location fields, rent fields, capacity fields, published_at, last_confirmed_at | Canonical rental offer |
| listing_images | id, listing_id, storage_key, display_order, alt_text | Ordered authorized photos |
| amenities + listing_amenities | amenity_id, listing_id | Filterable facilities |
| favorites | user_id, listing_id, created_at (composite unique) | Persistent saved listings |
| rental_requests | id, user_id nullable, verified_contact_id nullable, location, type, maximum_budget, minimum_rooms/beds, move_in_window, status, alert_consent | Demand capture |
| saved_searches | user_id, structured_filters, notifications_enabled | Alert preferences |
| notifications | recipient_user_id, type, payload safe fields, read_at, created_at | In-app alert records |
| listing_reports | id, listing_id, reporter_id/email verified, reason, details, status | Abuse/report queue |
| listing_reviews | id, listing_id, reviewer_id, decision, reason, created_at | Moderation decision history |
| consent_events | id, subject_id/contact_ref, scope, version, timestamp | Posting, notifications, privacy consent |
| ownership_claims | id, listing_id, claimant_id, token_hash, expires_at, status | Secure listing takeover |
| admin_audit_events | actor_id, action, resource_type, resource_id, before/after metadata, time | Accountability |
| contact_events | listing_id, actor_user_id nullable, action_kind, coarse analytics, created_at | Contact-button usage metrics, not proof of a completed lease |

**Core listing fields:** property_type enum (house, apartment, boarding_house, dorm, bedspace), rental_mode (whole_unit, per_room, per_bed), city, province, barangay, approximate_latitude/longitude, private precise address optional, monthly_rent_centavos, additional fees/deposit structured, bedroom_count nullable, bathroom_count nullable, beds/capacity nullable, furnishing, pet_policy, parking, available_from, rules, owner-contact mode, moderation status.

**Important constraint:** For bedspaces and boarding houses, “number of bedrooms” is not necessarily meaningful; model price-per-bed and available slot count separately. Currency is stored as integer centavos, not floating-point amounts.

**Avoid accidental PII publication:** Exact address, owner phone numbers, ID scans, claim evidence, renter email, rental request free-text, and audit logs are never returned in public listing APIs unless specific owner-selected fields are intended to be public.

### Listing lifecycle
DRAFT -> PENDING_REVIEW -> PUBLISHED -> PAUSED / OCCUPIED / EXPIRED / REMOVED.  
PENDING_REVIEW -> REJECTED -> DRAFT when revision is needed.  
Transitions require server-verified actor and transition permissions; timestamp and reviewer are stored. Material edits can put a previously published listing back in review.

### Future billing and property management tables
- plans, subscriptions, billing_customers, provider_payments, webhook_events, featured_campaigns
- properties/buildings, units/rooms/beds, memberships, occupants, leases, rent_charges, payment_records, maintenance_tickets
- **Do not build these into MVP** unless an owner pilot clearly needs them.
- On any payment integration, verify signed webhook events, deduplicate provider event IDs, record an append-only ledger and reconcile payment status server-side; frontend success screens do not prove payment.

## 8. Security, privacy and legal checks

### Security requirements
- Validate all inputs server-side; parameterized SQL only.
- Server-side authentication and per-record authorization on **every** mutation and private read; ID guessing cannot bypass owner scopes.
- SameSite/Secure/HttpOnly cookie settings and safe OAuth redirects.
- Rate-limit authentication, listing creation, report submission, guest request form, contact events, emails, and claim token checks.
- Never expose DATABASE_URL, OAuth secrets, API keys, VAPID private key, email credentials or payment secrets in NEXT_PUBLIC_ variables or Git history.
- Limit photo size/type/count, inspect true MIME, strip EXIF/geolocation, normalize/re-encode, block SVG/HTML masquerading as photos, remove unsafe metadata. Set ownership-based signed upload permits.
- Separate public property images from sensitive verification documents; evidence stored privately with restricted admin access and short retention.
- Enforce file quotas to contain storage bills and abusive uploads.
- CSRF/origin protections, strict response headers, CSP compatible with allowed assets, monitoring and patch cadence.
- No marketing trackers without adequate disclosure/consent where required.
- Backups, tested restores, least-privilege infrastructure users, and rollback procedure.

### Philippines regulatory and trust gates
- **Data Privacy Act (RA 10173):** document processing purpose/legal basis, privacy notice, consent where relied on, data retention, contact for data-subject requests, and incident response; use NPC guidance. Determine any registration/notification obligations with qualified advice.
- **Real Estate Service Act (RA 9646):** compensated activities around listing, promoting, negotiating or brokering property leases may be regulated. A “tech platform” label alone does not resolve this. Obtain local qualified legal/licensing review before paid listing promotion, lead fees, transaction commissions, or services potentially involving regulated brokerage. If partnering with a licensed broker, document responsibilities.
- Assess Philippine business registration, local permits, tax invoices/receipts, consumer protection and online platform obligations before revenue.
- Create Terms, Privacy Notice, Listing Policy, Safety Guide, Report/Removal process and contact address.
- Never claim to guarantee a landlord, rental offer, listing rights, or payment safety.
- Support plain-language English and Filipino safety notices.

## 9. Monetization plan and experiments

**Pricing is a hypothesis, not a promised market rate.** Keep basic renter search and basic owner listings free initially.

| Proposed offer | Illustrative test price | Qualification |
|---|---:|---|
| Free listing | ₱0 | Initial marketplace supply |
| Boosted visibility | ₱79 per seven days | Only after legal review and meaningful traffic |
| Owner Pro | ₱199 per month | Multiple listings, more analytics, convenience |
| Boarding House Pro | ₱399 per month | Unit vacancy + simple operational tools |
| Custom landlord website | ₱2,500–₱8,000 one-time | Quote scope, hosting, domain and maintenance separately |

**Prefer earliest income experiment:** Sell a clearly scoped custom website or owner operations setup to a landlord (subject to local business/tax requirements), while HomeTayo itself grows as free software. Do not make projections that assume immediate subscription conversion.

**Payments phase:** Evaluate PayMongo or another Philippine gateway for payment links / hosted checkout. Recurring payment method support, account approval and availability must be verified before choosing automated subscriptions. Start with manual invoicing/payment link where appropriate; never hand-roll raw card storage.

**Measurement:** Track qualified service leads, paid acceptance, actual margin, support load and refund requests. Calculate gross sales separately from net after gateway/hosting/tax and customer support costs.

**Ad placement ethics:** Featured listings must be labeled and must not suppress the user's clearly chosen search filter constraints. Organic ranking prioritizes relevance, freshness and completeness.

## 10. Marketplace seeding and growth

### Supply-first launch strategy
1. Interview 10–15 landlords and 10–15 renters in Koronadal. Ask about active vacancies, current posts, inquiry volume, problems, price objections and management needs.
2. Build a simple owner-intake page/Google Form equivalent and a waitlist. Collect permission for every listing/photo. Offer done-for-you setup for initial owners.
3. Recruit 10 real owners and 20–30 unique approved listings; at least a few family houses if reasonably available.
4. Give each owner a shareable link; tell them to keep posting on Facebook and include the HomeTayo link. Do not mass spam groups.
5. Publish truthful local search pages and promote renter request feature when supply is thin.
6. Ask owners for feedback after real inquiries, not raw traffic metrics.
7. Offer custom website / management demos to owners who repeatedly use listings; test willingness to pay without making payment necessary to stay listed.

### Launch loop
Owner provides authorized listing -> trustworthy renter result -> contact click -> owner reports value -> owner shares link and refreshes vacancies -> more supply -> more renters.  
When no relevant listing exists: renter request -> privacy-preserving aggregate demand -> recruit landlords for that category -> notify opted-in renter when a qualified listing appears.

### Geographic rollout gates
Start with Koronadal only. Add neighboring cities/municipalities after the first area has active supply, a manageable moderation queue, and verified repeat demand. Do not create dozens of empty SEO landing pages.

### Baseline launch targets (validation gates, not forecasts)
- >=10 consenting distinct property owners.
- >=20 genuine approved listings that were availability-confirmed within 14 days.
- All owners can edit/pause; no severe open security defects or unresolved credible scam reports.
- At least 10 real rental requests or qualified inquiry interactions from pilot users.
- Respond to credible urgent property fraud reports within a documented operational window.

## 11. Development milestones, sequencing, and acceptance tests

**Schedule is a proposed solo-developer sequence, not a guaranteed delivery deadline.** Reassess after implementation.

### M0: Discovery and UX (week 1)
- Validate interviews, owner consent process, rent categories, search filters.
- Wireframe mobile renter search, detail page, owner new-listing and admin review.
- Finalize brand decision, data model v1, listing rules, and hosting boundaries.
**Done when:** clickable prototype demonstrates all critical flows and 10 owners confirm feasibility of listing.

### M1: Foundation (weeks 2–3)
- Next.js/TypeScript/Tailwind setup, lint/formatter/tests, Drizzle migrations, Neon dev database, Auth.js Google.
- Environment separation, config validation, CI checks, secure session design, PWA manifest/icons.
**Done when:** auth works; migrations run cleanly; roles are enforced; preview deploy is usable on Android; secrets remain server-only.

### M2: Marketplace core (weeks 4–5)
- Owner property create/edit, draft/review/publish transitions, image upload/processing, moderation.
- Public search, detail pages, city/barangay filters, sort/pagination, direct contact.
**Done when:** moderator can publish legitimate owner property and guests can find/filter/open it; non-owner cannot edit it.

### M3: Demand and trust (weeks 6–7)
- Favorites, guest-verified rental requests, saved filters, contact analytics, report handling, freshness/expiry process, listing claims.
- Honest no-results screen; minimum alert delivery loop where configured.
**Done when:** empty search can create verified request and new matching published listing results in an authorized in-app/opt-in alert; reports are actionable and audited.

### M4: PWA quality / private beta (weeks 8–9)
- Offline shell, install/update experience, loading/empty/error states, accessibility, SEO metadata, responsive QA.
- Run security and performance tests; collect real owner/listing pilots.
**Done when:** two different Android phones successfully install/use/update; basic view when offline does not expose private or stale-availability claims.

### M5: Koronadal launch (weeks 10–12)
- Owner onboarding, operational moderation schedule, support docs, legal/commercial hosting gate, monitoring and analytics.
- Launch publicly only when real listing inventory and safety gates pass.
**Done when:** launch criteria satisfied and zero-results UX works for underserved categories.

### M6: Post-validation paid modules (not a launch blocker)
- Custom site fulfillment templates, owner subscriptions (if legally cleared), boosted listing controls, payment webhooks, room vacancy dashboard.
**Done when:** an owner pilot pays and the software consistently provides measurable value.

### Automated testing matrix
- Unit: money centavos, filter builders, listing status transitions, request match logic.
- Integration: repository layer, migrations, owner authorization and moderation operations.
- E2E (Playwright): guest search, mobile filters, OAuth callback smoke test, owner create/edit/pause, admin approve, report listing, request matching, 403 for cross-owner edit.
- Security negative tests: IDOR, invalid claims, CSRF, oversized image, stored XSS, rate limits, forged payment callback (when applicable).
- PWA smoke tests: clean install, offline shell, update prompt, stale public listing indicators.
- Load: realistic search/read path at pilot traffic; watch database/Blob bill and bursty contact clicks.
- Human UAT: at least five renters and five owners, including nontechnical operators.

## 12. Repository and development operating rules

Recommended single-repo structure:

    hometayo/
      docs/
        PRODUCT_BLUEPRINT.md
        decisions/
        security/
      public/
        icons/
        sw.js
      src/
        app/
          (public)/
          (auth)/
          (owner)/
          (admin)/
          api/
        components/
          ui/
          rental/
          owner/
        db/
          schema/
          migrations/
        lib/
          auth/
          config/
          validation/
          search/
          security/
        server/
          listing/
          request/
          moderation/
        styles/
      tests/
        unit/
        integration/
        e2e/
      .env.example
      README.md

- main is the stable integration branch. Implement features on short-lived feature branches and review PRs before merge.
- Protect database production: separate dev/preview/prod connection strings and forbid preview migrations against production.
- Never commit .env.local, passwords, DB URLs, OAuth secrets, payment keys, uploaded IDs or raw user exports.
- Make schema changes via tracked additive migrations with backups/rollback strategy; do not wipe production data.
- Each work item reports **Prepared / Attempted / Executed / Verified / Not executed**, with commands and evidence when applicable.
- Each PR has scope, screenshots, automated test output, migration impact, risks and rollback steps.
- Do not claim production deployment, live notifications or payment readiness without direct verification.

## 13. Infrastructure and budget considerations

**Prototype:** GitHub repo, local development, Neon development DB/free tier subject to live terms, temporary image storage with quotas, Vercel noncommercial prototype deployment or equivalent, Google OAuth, managed TLS.

**Production/commercial:** Domain + DNS, permitted commercial hosting plan, managed Postgres, object storage/egress, transaction email, monitoring/backup and support. Maintain budget alerts; exact monthly costs vary with traffic, image volume and plan rates. Do not budget production as “₱0 forever.”

**Operational tasks:** Rotate credentials, capture error reports, archive stale listings, handle owner deletion and account export requests, monitor reports, validate storage spend, and test database restore.

**Cron:** Vercel Hobby supports no more than once-daily cron execution with imprecise start timing; do not depend on exact-hour reminders until on suitable paid infrastructure.

## 14. Decision log and open questions

| Area | Decision for MVP | Confirm before public beta |
|---|---|---|
| Brand | HomeTayo provisional | Philippine IPOPHL trademark and domain/handle availability |
| Geography | Koronadal first | Actual owner availability and coverage |
| Revenue | Free initial listings; custom website experiment | Legal classification and business registration |
| Hosting | Next.js portable; Vercel prototype | Commercial hosting plan before monetization |
| Authentication | Google OAuth | OAuth credentials + tested production callback |
| Database | Neon Postgres + Drizzle | Region/connection limits/backup approach |
| Maps | Approximate location; MapLibre when compliant provider chosen | Tile/geocoder terms and expenses |
| Media | Object store for listings | Upload limits and costs; private evidence handling |
| Contact | Owner-approved Messenger/phone | Consent and visibility UX |
| Alerts | In-app first; optional email | Provider and deliverability; unsubscribing |
| Payments | Deferred | PSP suitability, recurring support, webhook behavior |
| Owner proof | Administrative review & claim workflow | Exact safe verification standard |
| Availability | Reconfirm at 14 days, expiry process after ~30 | Owner interview feedback |
| Language | English/Filipino | Text review and later regional languages |

## 15. Immediate next actions

1. Approve this specification and keep it version-controlled.
2. Interview 10 property owners and 10 prospective renters, record key assumptions.
3. Create mobile low-fidelity wireframes and the listing data contract.
4. Scaffold Next.js app in a separate feature branch; no payment gateway until demand validated.
5. Implement M1; then M2 and M3, with permission tests before public beta.

---

## References and validation notes

Official sources consulted (October 2026; recheck when implementing):
- Next.js PWA guide: https://nextjs.org/docs/app/guides/progressive-web-apps
- Next.js authorization guidance: https://nextjs.org/docs/app/guides/authentication
- Drizzle + Neon: https://orm.drizzle.team/docs/connect-neon
- Vercel Blob: https://vercel.com/docs/vercel-blob
- Vercel Hobby noncommercial restrictions: https://vercel.com/legal/terms
- Vercel cron scheduling limits: https://vercel.com/docs/cron-jobs/usage-and-pricing
- OpenStreetMap tile usage policy: https://operations.osmfoundation.org/policies/tiles/
- National Privacy Commission data subject rights: https://privacy.gov.ph/data-subject-rights/
- Data Privacy Act: https://privacy.gov.ph/Data-Privacy-Act/
- RA 9646: https://lawphil.net/statutes/repacts/ra2009/ra_9646_2009.html
- PayMongo subscriptions documentation: https://docs.paymongo.com/docs/payment-acceptance-subscriptions

**Version change policy:** Significant scope, price, compliance or architecture decisions require a dated change to this document plus an implementation issue/PR.