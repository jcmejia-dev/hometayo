# HomeTayo Development Tooling

**Status:** Tooling recommendations and setup instructions. Creating this file does NOT install any CLI, browser, container, plugin, or MCP server.  
**Applies to:** https://github.com/jcmejia-dev/hometayo  
**As of:** 2026-10-12

## What belongs where?

| Tool | Target environment | HomeTayo status |
|---|---|---|
| Context7 | Connected ChatGPT plugin or coding-agent MCP client | ChatGPT plugin connected and documentation lookup verified 2026-10-12; local MCP not installed |
| Playwright CLI | Developer computer / coding agent runtime | Not installed in project yet |
| Playwright Test | Dev dependency in scaffolded Next.js app | Not installed yet |
| Supabase CLI | Supabase projects; NOT necessary with Neon + Drizzle | Deliberately not included |
| Strix | Isolated authorized local/staging security lab | Not installed or scanned |
| SkillUI | Optional developer-only exploration on trusted sources | Not installed or run |

## 1. Connect Context7 directly to ChatGPT

**Verified 2026-10-12:** The user connected the Context7 ChatGPT plugin. A documentation lookup for `/vercel/next.js` succeeded, returning current App Router PWA instructions for `app/manifest.ts`, installability, and service workers. Context7 is available to this ChatGPT conversation; this does **not** install a Context7 MCP server on the user's computer or in the HomeTayo repository. If a later session is not connected, consult official sources instead of claiming a lookup occurred.

Official guide: https://context7.com/docs/resources/all-clients

Context7 is for **coding documentation**, not for hosting, running SQL, or shipping the HomeTayo app.

For other local coding agents that support MCP, configure the Context7 remote server according to the **agent's** official instructions. Do not commit auth tokens in MCP config. Example unauthenticated URL or OAuth authorization depends on client implementation.

## 2. Playwright CLI — agent browser testing

**Official source:** https://github.com/microsoft/playwright-cli

After the Next.js scaffold exists, use a modern supported Node.js version and install agent browser automation either globally or as a dev-only dependency:

```bash
npm install -g @playwright/cli@latest
playwright-cli --help
```

Optional skill installation **on the user's local coding machine**, after reviewing the installer's effects:

```bash
playwright-cli install --skills
```

Browser smoke testing after local dev server runs on port 3000:

```bash
npm run dev
# In another terminal:
playwright-cli open http://localhost:3000
playwright-cli screenshot
```

Install standard Playwright Test separately once app scaffolding exists:

```bash
npm install -D @playwright/test
npx playwright install chromium
```

Recommended smoke scenarios: homepage opens, search filter changes, empty results CTA, owner login gate, listing details, report action. Add accessibility/mobile viewport tests. Ensure test data clearly identifies fixtures and cannot be confused with actual live rental inventory.

**Browser automation is not proof that Google OAuth, push notification delivery, a production database migration, or real payment processing works.** Those need their own end-to-end checks.

## 3. Why skip Supabase CLI?

Our database architecture is **Neon PostgreSQL + Drizzle**, so use Drizzle migrations and Neon development branches/instances. Supabase CLI targets Supabase project workflows and is not necessary simply because the DB uses PostgreSQL. If provider architecture is formally changed, re-evaluate the Supabase CLI.

If desired for an entirely separate Supabase-backed project, the official command is:

```bash
npm install --save-dev supabase
npx supabase --help
```

Do **not** run `supabase init` or connect Supabase to HomeTayo without agreement. Official docs: https://supabase.com/docs/guides/local-development/cli/getting-started

## 4. Strix — later, explicit security gate

Official: https://github.com/usestrix/strix  
Strix is an autonomous agent-driven penetration testing tool, not a general code formatter or unit-test runner. It may require Docker, a compatible LLM provider/API key, and spend limits; running agents can be costly. Follow the vendor docs and vet any installer before use.

Use only against **owned and explicitly approved** local or isolated staging assets. Never point Strix at social platforms, third-party tenant sites, production databases, Vercel shared endpoints without permission, or anyone else's infrastructure.

Before executing, document (a) authorized target, (b) snapshot/test data, (c) scan mode and spending cap, (d) expected disruptive effects, (e) remediation/rollback, and (f) how results will be stored privately. No scheduled Strix scanning has been configured.

A lightweight, non-invasive dependency/security baseline should precede any autonomous pentesting: linting, dependency audit review, server authorization tests, secret scanning, and manual threat model.

## 5. SkillUI — optional design reference study

Source: https://github.com/amaancoderx/npxskillui

SkillUI is a community CLI for extracting design tokens and a skill document from a public site, repo, or local code. The independent package requires trust review before running. Use its output only for **design learning**, not pixel-perfect duplication of another site's branding, custom assets, or content. Do not automatically copy its generated `CLAUDE.md` or `SKILL.md` over HomeTayo's documented identity, design tokens, and coding rules.

Only after reviewing source/dependencies, an optional developer-machine installation would be:

```bash
npm install -g skillui
skillui --dir ./src
```

Do not run `skillui --dir ./src` until `src` actually exists. Ultra mode may require full Playwright/browser installation and should only target sites you are permitted to inspect.

## 6. How we verify agent tooling is truly ready

- **Context7:** PASSED in this ChatGPT session (Next.js App Router PWA documentation retrieved 2026-10-12). Local coding-agent MCP remains separately uninstalled.
- **Playwright CLI:** `playwright-cli --help` succeeds on the same machine that runs the app, and a screenshot of a local HomeTayo page is captured.
- **Playwright Test:** a committed deterministic test passes in CI.
- **Supabase CLI:** intentionally absent while Neon remains the chosen provider.
- **Strix:** a user-approved scan of an owned isolated staging environment completes; findings reviewed and no secrets disclosed.
- **SkillUI:** the selected source was security/licensing-reviewed, CLI help works locally, and a sample token-only scan produces inspectable output.

## 7. Next coding milestone

Complete/review Blueprint PR #1. Scaffold Next.js in a **new feature branch**, add `@playwright/test` and baseline CI alongside functional pages, then add the agent CLI to a developer's environment. No automation should claim an untested feature is verified.

**References (vendor docs):**
- https://github.com/microsoft/playwright-cli
- https://playwright.dev/docs/intro
- https://context7.com/docs/resources/all-clients
- https://supabase.com/docs/guides/local-development/cli/getting-started
- https://github.com/usestrix/strix
- https://github.com/amaancoderx/npxskillui
