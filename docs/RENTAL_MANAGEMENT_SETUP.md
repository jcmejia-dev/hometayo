# Rental management setup

The implementation is in PR #42. It is not enabled in production automatically.

1. Review additive migrations `005_rental_units.sql` and `006_rental_operations.sql`.
   Back up the intended database and test on a separate development database first.
   Point DATABASE_URL at that development database and run `npm run db:migrate`.
2. In the web server environment, set `ENABLE_RENTAL_MANAGEMENT=true` after both
   migrations succeed. Keep authentication and native sessions configured as before.
   Never put DATABASE_URL or AUTH_SECRET in an EXPO_PUBLIC variable.
3. Start the server. An owner adds a genuine listing and units under Owner studio →
   Manage rooms & availability. Do not create fake production inventory for testing.
4. A distinct renter opens a published rental and selects Message owner. Both users
   can use Messages (web) or the account workspace (Android).
5. Owner selects an available unit in the conversation and sends an invitation with
   the agreed rent and start date. Renter accepts. Check that only that unit becomes
   occupied and the public availability count decreases by one.
6. Owner adds a dated rent charge, records a partial payment, and sends a reminder.
   Renter checks their own ledger and notification inbox. Another account must not
   be able to read or modify that conversation or ledger.
7. Test a correction: void the payment with a reason. If correcting a charge, void
   its non-voided payments first, then void the charge. History remains visible.
   Owner totals exclude voided amounts and distinguish charged rent from receipts.
8. Record move-out with a valid date; the same unit becomes available. Charges and
   payment history remain accessible after move-out.
9. Test web and an updated Android development build against the development API.
   Set EXPO_PUBLIC_API_URL to its HTTPS origin for the device. Browser localhost is
   not the phone's localhost. Do not enable real production features through a local
   development URL.

Production migration/deployment and release of an Android update are separate
actions requiring explicit authorization. No secrets or production data need to be
pasted into chat. In-app notifications refresh while the workspace is open;
background push and email reminders are not part of this configuration.

Photo posts currently accept public HTTPS image links, not camera/file uploads.
Use photos the owner has permission to publish. Saving a photo set replaces it and
sends the listing back to review. No existing listing is auto-approved.
