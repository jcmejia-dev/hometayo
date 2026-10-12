<#
.SYNOPSIS
  Install optional HomeTayo developer CLIs on THIS Windows computer.
.DESCRIPTION
  Installs Playwright CLI globally (and optionally SkillUI) after you intentionally run it.
  Does not connect a ChatGPT plugin, create a database, run browser scans, or deploy anything.
  Strix and Supabase CLI are intentionally NOT auto-installed.
.EXAMPLE
  .\scripts\setup-dev-tools.ps1 -CheckOnly
.EXAMPLE
  .\scripts\setup-dev-tools.ps1
.EXAMPLE
  .\scripts\setup-dev-tools.ps1 -WithSkillUI -InstallAgentSkills
#>

[CmdletBinding()]
param(
  [switch]$CheckOnly,
  [switch]$WithSkillUI,
  [switch]$InstallAgentSkills
)

$ErrorActionPreference = 'Stop'

function Assert-LastExit([string]$Name) {
  if ($LASTEXITCODE -ne 0) {
    throw "$Name failed with exit code $LASTEXITCODE"
  }
}

function Test-Tool([string]$Name) {
  return $null -ne (Get-Command $Name -ErrorAction SilentlyContinue)
}

Write-Host "HomeTayo developer-tool setup" -ForegroundColor Cyan
Write-Host "Runs only on this computer; never modifies production."
Write-Host ""

if (-not (Test-Tool "node")) {
  throw "Node.js 20+ is required. Install an active supported Node.js LTS release first: https://nodejs.org/"
}
if (-not (Test-Tool "npm")) {
  throw "npm is required. Install it with Node.js."
}

$nodeVersion = (& node --version).Trim()
Assert-LastExit "node --version"
$nodeMajor = [int]($nodeVersion.TrimStart('v').Split('.')[0])
if ($nodeMajor -lt 20) {
  throw "Node.js 20+ required, found $nodeVersion."
}

Write-Host "Node.js: $nodeVersion"
Write-Host "npm: $((& npm --version).Trim())"
Assert-LastExit "npm --version"

if (-not $CheckOnly) {
  Write-Host ""
  Write-Host "Installing Playwright CLI using npm..." -ForegroundColor Yellow
  & npm install --global '@playwright/cli@latest'
  Assert-LastExit "npm install @playwright/cli"

  if ($InstallAgentSkills) {
    Write-Host "Installing optional Playwright agent skills..." -ForegroundColor Yellow
    & playwright-cli install --skills
    Assert-LastExit "playwright-cli install --skills"
  }

  if ($WithSkillUI) {
    Write-Host "Installing optional third-party SkillUI..." -ForegroundColor Yellow
    & npm install --global 'skillui@latest'
    Assert-LastExit "npm install skillui"
  }
} else {
  Write-Host "CheckOnly: no packages will be installed." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Tool checks:" -ForegroundColor Cyan
if (Test-Tool "playwright-cli") {
  Write-Host "  Playwright CLI: installed/command found" -ForegroundColor Green
  & playwright-cli --help | Out-Null
  Assert-LastExit "playwright-cli --help"
} else {
  Write-Host "  Playwright CLI: not found" -ForegroundColor Yellow
}

if (Test-Tool "skillui") {
  Write-Host "  SkillUI: installed/command found (not run against any site)" -ForegroundColor Green
  & skillui --help | Out-Null
  Assert-LastExit "skillui --help"
} else {
  Write-Host "  SkillUI: not found (optional)" -ForegroundColor Yellow
}

if (Test-Tool "docker") {
  Write-Host "  Docker CLI: present (daemon not tested)" -ForegroundColor Green
} else {
  Write-Host "  Docker CLI: not found; Strix local mode cannot run without Docker." -ForegroundColor Yellow
}

if (Test-Tool "strix") {
  Write-Host "  Strix CLI: command found; no scan executed" -ForegroundColor Green
} else {
  Write-Host "  Strix CLI: not installed (intentionally deferred)" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Context7: connected to ChatGPT separately; no local MCP installed by this script."
Write-Host "Supabase CLI: intentionally skipped; HomeTayo uses Neon + Drizzle."
Write-Host "Playwright browser launch and E2E tests require a running HomeTayo app (not scaffolded yet)."
Write-Host "Next: scaffold Next.js, then install @playwright/test and create real tests."
