# Owner location and messaging

Owners select a location without typing latitude/longitude. The web form offers
address/landmark search, browser current-location permission, and a Google map for
click/drag adjustment when its browser key is configured. The Android form offers
address search, current location, and its existing Google map. Coordinate fields
stay internal; owners confirm a selected pin before submission. A pin remains
optional for the first listing submission.

## Configuration

- Existing `GOOGLE_PLACES_API_KEY` stays server-only. It powers explicit address
  searches on the web and in the app. Do not expose it through NEXT_PUBLIC/EXPO_PUBLIC.
- For the interactive **web** map, create a separate Google Cloud API key with
  **Maps JavaScript API** enabled. Restrict the application to Websites and allow
  `https://hometayoph.vercel.app/*` plus your actual local/preview origins as needed.
  Restrict the API to Maps JavaScript API. Do not reuse the Android-restricted key.
- Set `NEXT_PUBLIC_GOOGLE_MAPS_WEB_API_KEY` in local `.env.local` and Vercel's
  applicable environment. This browser key is public by design and must have its
  website/API restrictions configured. Redeploy after changing it because public
  environment variables are included at build time.
- Without that browser key, address search and current location still select a pin;
  the form describes why click/drag adjustment is not available.

See Google's [JavaScript loading guide](https://developers.google.com/maps/documentation/javascript/load-maps-js-api).
Search results are transient and attributed to Google Maps; the listing stores the
owner-confirmed point. No new database migration is needed beyond existing map
columns (004). `ENABLE_RENTAL_MANAGEMENT=true` must remain configured for messaging.

## In-app contact

New web/native submissions set no public phone/Messenger contact. The web form has
no external-contact selector or public-contact field. Rental details use Message
owner and the private HomeTayo workspace. Legacy contact columns and the read API
are retained for older installed app versions; new interfaces do not use external
contact links. Update the Android app code to receive these interface changes.

## Verification

Address-service tests mock Google requests, covering invalid input/locations,
missing configuration, rate limiting, and credential privacy. Browser UI checks
should mock geolocation and Google Maps to avoid consuming API quota or publishing
test properties. Real browser-key authorization and native device gestures require
testing with the configured development deployment/device.
