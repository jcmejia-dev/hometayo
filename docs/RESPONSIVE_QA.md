# HomeTayo Cross-Device Quality Baseline

**Status:** automated Chromium viewport checks are being added; physical devices and WebKit/Safari checks are still required. Never claim universal compatibility solely from passing simulations.

## First-release supported targets

- Narrow Android and iOS phone layouts: 320–430 CSS px.
- Large phones / landscape: 431–767 CSS px.
- Tablets: 768–1023 CSS px.
- Desktop/laptops: 1024–1919 CSS px.
- Large desktop: 1920 CSS px and above with sensible max-width containers.

The application is a responsive web/PWA-first experience, not a native iOS/Android binary. Minimum supported operating systems/browser versions must be decided before public release, after device testing.

## Automatic checks

The Playwright projects in `playwright.config.ts` cover a 320px touch screen, Pixel 7, 768px portrait tablet, 1366px laptop, and 1920px desktop. Existing functional smoke tests run on each. `tests/e2e/responsive.spec.ts` checks:
- All currently implemented public routes avoid horizontal scrolling.
- Search form and property categories remain accessible.
- Compact menu on smaller screens and primary navigation on desktops work.
- Web manifest advertises standalone HomeTayo identity.

These tests do not verify installed PWA offline behavior, actual notch/safe-area behavior, screen readers, or native Safari/WebKit layout. Automated browser rendering can differ from physical devices.

## Manual quality gates before launch

1. Test real Android Chrome and iOS Safari on at least two phones, plus a tablet or representative device.
2. Test portrait + landscape, browser font-size enlargement and keyboard opening on the search form.
3. Test page pinch/zoom without interface breaking. Never disable user zoom.
4. Check safe-area insets, touchable buttons >=44px on touch navigation, accessible focus indicators, reduced-motion mode and contrast.
5. Test slow 3G/4G and unreliable connectivity, fresh/stale result statuses, retry behavior.
6. Test real PWA install and later update prompts on Android/iOS after service worker, 192px/512px icons and caching are implemented.
7. Run an authenticated account creation/edit/owner moderation E2E on every new screen after those features are built.
8. Capture screenshots from target devices in PR review and document any supported-device limitations.

## Commands

```powershell
npm run lint
npm run typecheck
npm run build
npx playwright install chromium
npm run test:e2e
```

For an individual target:

```powershell
npx playwright test --project=small-phone-320
npx playwright test --project=android-phone
npx playwright test --project=tablet-portrait
```

Use a test PR whenever a new route is added: extend responsive tests to cover it, don't just check the homepage.
