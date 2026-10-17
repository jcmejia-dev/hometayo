# Local chat design verification

These screenshots use synthetic conversations and mocked API responses, labeled LOCAL UI TEST. They do not show production messages, actual renters, or live inventory. The temporary QA route was removed before the production build.

Browser checks passed: notification dropdown, unread badge, mark read, Escape dismissal, conversation search, send message, tenancy controls, phone back navigation, no horizontal overflow at 390px, and no runtime errors. Desktop 1440px and phone 390px screenshots were visually reviewed.

52 unit tests passed, including authenticated/scoped notification response and safe failure checks. No production database changes or physical Android test were performed. This redesign targets the web and its phone browser layout; the native Android workspace is unchanged.
