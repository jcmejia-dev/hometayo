# Compact HomeTayo application experience

This update makes the existing HomeTayo Next.js app less like a long landing page and more like a useful mobile application.

- Shorter homepage: one search-led hero, paths for renters/landlords, property categories and a short pilot notice.
- On phone/tablet widths of 800px or less: persistent, accessible bottom navigation for Home, Explore, My listings and Profile. The header menu still provides how-to guides, rental safety and privacy.
- Hide the large illustrative hero preview on smaller screens. The actual search is prioritized, and no sample listing is published.
- Reduce vertical whitespace on renter search, owner dashboard, profile and admin overview.
- Owner dashboard shows total, in-review and live listing totals from the signed-in owner's own records.
- Profile preferences use two columns on wider screens; account/security details are expandable.
- Administrator counts and moderation queue remain available, while activity and moderation history move into a collapsible section. No changes to server role checks.

No database migration, credentials, new third-party dependencies, or changes to business logic are required. Keep migration 002_profiles_admin_activity.sql from Job 4 applied before testing authenticated profile/admin pages.

## Verification

Run npm run lint, npm run typecheck, npm run build, npm run test:unit, npm run test:e2e.

CI uses no real OAuth credentials; it only exercises signed-out layout and access boundaries. Test on an actual phone and desktop, particularly navigation, zoom, safe-area padding and authenticated screens.

Image uploads, profile pictures, notifications, payments and monetization dashboards remain unimplemented.