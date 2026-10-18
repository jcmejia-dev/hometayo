# Direct owner publishing

Approved by the user on 2026-10-18. This replaces mandatory administrator approval for every new listing.

- New web and native API submissions become published immediately, with publication and owner-confirmation timestamps.
- Existing pending or draft listings are not silently bulk-published. Their owners can choose Publish rental in their workspace. Paused listings can be republished by their owner.
- Owner-only publication is scoped by listing ownership. Rejected or removed listings cannot be republished through this action or through pin/photo edits.
- Pin and photo edits preserve publication status. Admins can remove published listings with a required reason and an audit record in listing_reviews. Existing pending-review controls remain for older submissions.
- Public language describes owner-published rentals; publication does not indicate independent ownership or property verification.
- No schema migration or new environment variable is required. No production inventory was modified as part of implementation.
- The server change applies to installed Android clients after backend deployment. Updated native labels and the pending-listing Publish button require an app update; no native dependency changed.
- This change does not add a renter reporting workflow.

Validation: local PGlite integration checks cover direct submission timestamps, owner isolation, pending publication, pin/photo status preservation, rejected/removed publication denial and audited administrator removal. Physical Android and real production accounts were not tested.
