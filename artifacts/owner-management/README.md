# Local UI verification

Screenshots use explicitly labeled, synthetic local UI fixtures. They are not real
listings, tenants, demand, or payments and were never inserted into production.

The actual RentalWorkspace and RentalSocial components were mounted on a temporary
development-only route. Playwright intercepted their HTTP calls with fixtures.
The temporary route was removed after verification. Database behavior is tested
separately by `tests/unit/rental-operations.test.ts` using local PGlite migrations.

Browser checks: desktop rendering, phone-width layout without horizontal overflow,
message submission, partial-payment form submission, reminder action, and marking
a notification read. `ui-checks.json` records the result. These are web browser
checks, not proof of execution on a physical Android device.
