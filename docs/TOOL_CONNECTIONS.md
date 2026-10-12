# Tool connection and setup — HomeTayo

Updated 2026-10-12. The tools below live in **different environments**. Installing a program on a PC does not give the ChatGPT web conversation permanent shell access to that PC.

## Verified connection status

| Tool | Status | Where it operates |
|---|---|---|
| GitHub | Connected: HomeTayo PRs #1 and #2 merged into main | ChatGPT GitHub connector |
| Context7 | Connected and queried: official Next.js App Router PWA documentation | ChatGPT Context7 plugin |
| Playwright CLI | **Not installed** on a persistent developer computer yet | Local machine or coding-agent cloud runtime |
| SkillUI | **Not installed**, optional | Local machine or coding-agent cloud runtime |
| Strix | **Not installed**; Docker, supported LLM provider and separate security-scan authorization required | Isolated developer/staging environment |
| Supabase CLI | **Not needed** while HomeTayo uses Neon PostgreSQL + Drizzle | Supabase projects only |

## On a Windows development computer

### Clone repo / get latest tools

In PowerShell, in a directory where you want to put the project:

~~~powershell
git clone https://github.com/jcmejia-dev/hometayo.git
cd hometayo
git pull origin main
~~~

If cloned already, use the last two commands in the existing clone; don't clone a duplicate.

### Inspect available software, no changes

~~~powershell
.\scripts\setup-dev-tools.ps1 -CheckOnly
~~~

This script prints versions and checks whether the commands exist. It **does not** connect ChatGPT to your machine.

### Install Playwright CLI

Review the script and the official Microsoft package first. The following command modifies your PC by installing the CLI globally:

~~~powershell
.\scripts\setup-dev-tools.ps1
~~~

Optional: also install SkillUI, a third-party CLI, and add Playwright agent skills for a compatible local coding agent:

~~~powershell
.\scripts\setup-dev-tools.ps1 -WithSkillUI -InstallAgentSkills
~~~

If PowerShell blocks script execution, inspect your execution policy and unblock this **specific trusted file** using your local policy. Do not disable security controls system-wide.

### Verification

~~~powershell
playwright-cli --help
# Optional if SkillUI was installed:
skillui --help
~~~

A successful help command **verifies only the CLI executable**, not browser binaries, user authorization, or real HomeTayo tests. The browser will be exercised once the app is scaffolded and running.

### Next step after app scaffolding

~~~powershell
npm install --save-dev @playwright/test
npx playwright install chromium
# Later, once tests exist:
npx playwright test
~~~

Playwright CLI is for interactive inspection; Playwright Test is for committed automated E2E tests. Both are useful.

## Strix — intentionally deferred

Strix is autonomous penetration testing. It requires Docker (local mode), an LLM provider key or separately authorized cloud setup, and an explicit security-testing target. Do not run it on production, public third-party platforms or accounts. No Strix target has been approved, and no scan was attempted. We will consider it only after HomeTayo has a testable isolated staging deployment with a budget and written scope.

Official source: https://github.com/usestrix/strix

## SkillUI — optional visual analysis

SkillUI can inspect a codebase or website to extract design tokens, but it is community-maintained and outputs may include generated instructions. Review source and generated files before using any extracted materials. Do not copy someone else's brand, imagery or proprietary implementation. Prefer original HomeTayo tokens from the blueprint.

Official source: https://github.com/amaancoderx/npxskillui

## Supabase CLI — deliberate exclusion

HomeTayo's chosen persistence is **Neon PostgreSQL + Drizzle**, so its database migration command will come from the application scripts created during scaffolding. Do not use \`supabase init\` or \`supabase db push\` on HomeTayo. Supabase CLI is valuable if we ever formally change to Supabase-hosted services.

Official source: https://supabase.com/docs/guides/local-development/cli/getting-started

## No silent assumptions

- Existing ChatGPT tools: GitHub + Context7.
- Not available as direct ChatGPT tool connections at this time: Playwright CLI, Strix, SkillUI, Supabase CLI.
- In this ChatGPT execution environment, npm registry access failed during an attempted version lookup. No packages were installed here.
- This repo currently has documentation and this setup helper, **not a Next.js application**, so no automated browser test, deployment, pentest, or database migration has run.
- After running the PowerShell script on your computer, paste the output of \`playwright-cli --help\` (or show a screenshot) to confirm machine-side installation.

## References
- https://playwright.dev/docs/getting-started-cli
- https://playwright.dev/docs/ci
- https://github.com/usestrix/strix
- https://github.com/amaancoderx/npxskillui
- https://supabase.com/docs/guides/local-development/cli/getting-started
