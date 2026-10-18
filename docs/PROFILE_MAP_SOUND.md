# Profile, role guides, rental maps and notification sound

## Setup

Run `npm run db:migrate` against the existing HomeTayo database to apply additive migration 007_profile_photo.sql. It adds an optional account thumbnail. Existing role, email, listings and preferences are preserved. Until migration 007 is applied, photo controls show a setup message; normal profiles continue working.

The rental search map uses NEXT_PUBLIC_GOOGLE_MAPS_WEB_API_KEY (Maps JavaScript API, website restrictions) and destination search uses the existing server GOOGLE_PLACES_API_KEY. Rebuild/redeploy Vercel after adding a public browser key. Do not reuse an Android-restricted key. Missing or rejected browser authorization shows an explicit fallback; Google key authorization still needs live verification.

## Behavior

Owners see owner guides and management links; renters see renter guides and search preferences. Guests can choose either guide. Roles are not changed.

Profile photo uploads accept JPG/PNG/WebP under 5 MB, center-crop in the browser and save a bounded 256px JPEG thumbnail to the signed-in account. API writes enforce session, same origin, image signatures, size and rate limits. No remote URL fetch or external image host is needed.

The supplied notification.mp3 plays only for new unread notifications after browser interaction. Initial history and read updates stay silent. The bell panel has a persistent mute toggle. This is foreground web notification audio, not background push.

Search maps show the same filtered published rentals (up to 24); only listings with saved coordinates have map markers. Owners without pins remain in rental cards. Destination/GPS comparisons sort the current mapped matches by straight-line distance, not driving distance or all national inventory.

The dashboard apartment image is AI-generated decoration labeled as an illustration, not an actual available listing. No synthetic rental inventory is published.
