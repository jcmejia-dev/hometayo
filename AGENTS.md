# HomeTayo — Coding Agent Guide

Repository: https://github.com/jcmejia-dev/hometayo  
Project: Koronadal-first rental marketplace, Next.js + TypeScript + Tailwind + Neon PostgreSQL + Drizzle, installable PWA.

## Non-negotiable guardrails
- This repository currently contains planning files, not a scaffolded application. Do not claim tests, migrations, API requests, installations, or deployments were executed unless verified.
- Never deploy, mutate production data, run remote penetration tests, or change the database provider without explicit authorization.
- Keep `main` stable: implement on feature branches and submit PRs with screenshots or test output.
- Secrets belong in local ignored `.env.local` or deployment secrets, never commits, console screenshots, or public logs.
- Follow approved blueprint in `docs/PRODUCT_BLUEPRINT.md` once its PR is merged; until then, consult PR #1.
- No fake real-property listings, unlicensed copied photos, fabricated demand counts, or false verification badges.
- Require server-side ownership checks for all landlord and moderator actions.
- Report work using **Prepared / Attempted / Executed / Verified / Not executed** with evidence; distinguish code review from runtime validation.

## Development assistants and tools
1. **Context7 (connected ChatGPT plugin / optional coding-agent MCP):** Context7 was connected and successfully queried for official Next.js App Router PWA documentation on 2026-10-12. Use it for current library APIs when available; this does not mean Context7 MCP has been installed on a local coding machine. Re-check connection status in each session.
2. **Playwright CLI:** Preferred for agent-driven browser inspection/screenshots after the web app exists; install `@playwright/cli` in the local coding environment, and add project E2E tests with `@playwright/test` when implementing the UI. CI tests must be deterministic.
3. **Neon + Drizzle:** Use tracked migrations. Do not use Supabase CLI or Supabase projects unless a specific, approved architecture change is made.
4. **Strix:** Optional security scan on local/test assets **owned by the project only**, after preview is functional. Requires separate local/container setup, model credentials, an agreed budget and target permission; never run against third-party services.
5. **SkillUI:** Optional design-token extraction helper, not a runtime package. Review source and licensing before execution; study reference patterns without copying proprietary artwork or designs verbatim.

See [docs/DEV_TOOLING.md](docs/DEV_TOOLING.md) for installation notes and verification checkpoints.

## Delivery procedure
1. Inspect latest repository files and active PRs; identify current task and scope.
2. State plan, environment, risk, and verification checklist.
3. Make a small change on a branch with clear commit history.
4. Run appropriate static validation, automated tests, Playwright browser checks if available, and manual mobile checks; report unavailable test infrastructure.
5. Confirm changed files, PR link, test output, known limitations, and whether deployment occurred.
