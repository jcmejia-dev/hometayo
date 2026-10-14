# Separate web and native experiences

Website: public product landing page → Sign in / Create account → authenticated renter/property-owner choice → rental home or owner dashboard. Install Android app links to /download. Explicit introduction replay remains available; first-time website visitors are not forced into an app-style dialog.

Account choice only accepts renter/owner, requires the current authenticated identity, and only updates ordinary renter/landlord roles. Administrator and moderator roles are preserved. Property ownership and publication checks remain required. Members can revisit /account/start from their profile. No database migration is needed for this choice, and no production data was changed during implementation.

Native: dedicated introductory screens → Continue → Sign in / Create account choice → renter/property-owner choice → native account forms and secure session. Public guest browsing remains available. Maps, native Google sign-in and EAS Update require the new native release; see NATIVE_AUTH_MAPS_UPDATES.md.

Email account creation still requires email delivery configuration and migration 003. Google sign-in still depends on the correct registered callback URI. Website installation links require a published signed APK URL in ANDROID_APK_URL.
