# Owner location UI checks

Screenshots and `ui-checks.json` come from a temporary local route mounting the
actual PropertyLocationPicker. Google Maps, address results, and geolocation were
mocked. No API quota, device location, account credentials, or production listings
were used. The temporary route is removed before delivery.

Verified: coordinate inputs are hidden; address selection populates the selected
point; map click and marker drag update it; current location selects a point;
changing a pin clears its required confirmation; form submission preserves the
confirmed coordinates; the phone-width layout has no horizontal overflow; the real
owner address endpoint rejects an unauthenticated request.

These checks do not prove that the production Google browser key is configured or
that the updated Android interface has been exercised on a physical device.
