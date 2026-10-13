import { expect, test } from "@playwright/test";

const publicRoutes = ["/", "/rentals", "/owner", "/owner/listings/new", "/sign-in", "/how-it-works", "/profile", "/requests/new", "/safety", "/privacy"];

test("all current public screens fit the viewport without horizontal page scrolling", async ({ page }) => {
  for (const route of publicRoutes) {
    await page.goto(route);
    await expect(page.locator("#main-content")).toBeVisible();

    const metrics = await page.evaluate(() => ({
      windowWidth: window.innerWidth,
      htmlWidth: document.documentElement.scrollWidth,
      bodyWidth: document.body.scrollWidth,
    }));

    expect.soft(metrics.htmlWidth, `Document overflow on ${route} at ${metrics.windowWidth}px`).toBeLessThanOrEqual(metrics.windowWidth + 1);
    expect.soft(metrics.bodyWidth, `Body overflow on ${route} at ${metrics.windowWidth}px`).toBeLessThanOrEqual(metrics.windowWidth + 1);
  }
});

test("home search, category navigation and listing empty state remain usable", async ({ page }) => {
  await page.goto("/");
  const search = page.getByRole("search");
  await expect(search).toBeVisible();
  await expect(search.getByRole("button", { name: /Search rentals/i })).toBeVisible();
  await expect(page.getByRole("link", { name: /Houses.*Room to grow/i })).toBeVisible();

  await search.getByRole("combobox", { name: "Property type" }).click();
  await page.getByRole("option", { name: "Whole house" }).click();
  await search.getByRole("combobox", { name: "Minimum bedrooms" }).click();
  await page.getByRole("option", { name: "4+ bedrooms" }).click();
  await search.getByRole("button", { name: /Search rentals/i }).click();
  await expect(page).toHaveURL(/type=house/);
  await expect(page).toHaveURL(/bedrooms=4/);
  await expect(page.getByRole("heading", { name: /preparing the first listings/i })).toBeVisible();
});

test("navigation is available on touch and desktop layouts", async ({ page }) => {
  await page.goto("/");

  // Real CSS breakpoint, rather than Playwright's device label, determines the menu.
  const menu = page.locator(".mobile-menu");
  if (await menu.isVisible()) {
    const toggle = menu.locator("summary");
    await expect(toggle).toBeVisible();
    await toggle.click();
    await expect(menu.getByRole("link", { name: "Explore rentals" })).toBeVisible();
    await menu.getByRole("link", { name: "Explore rentals" }).click();
  } else {
    await expect(page.getByRole("navigation", { name: "Primary navigation" })).toBeVisible();
    await page.getByRole("navigation", { name: "Primary navigation" }).getByRole("link", { name: "Explore rentals" }).click();
  }
  await expect(page).toHaveURL(/\/rentals$/);
});

test("PWA manifest advertises HomeTayo without relying on device-specific markup", async ({ request }) => {
  const response = await request.get("/manifest.webmanifest");
  expect(response.ok()).toBeTruthy();
  const manifest = await response.json();
  expect(manifest.short_name).toBe("HomeTayo");
  expect(manifest.display).toBe("standalone");
  expect(manifest.start_url).toBe("/");
  expect(manifest.icons.length).toBeGreaterThan(0);
  expect(manifest.icons).toEqual(expect.arrayContaining([
    expect.objectContaining({ src: "/pwa-icon-192.png", sizes: "192x192", type: "image/png" }),
    expect.objectContaining({ src: "/pwa-icon-512.png", sizes: "512x512", type: "image/png" }),
    expect.objectContaining({ src: "/pwa-maskable-512.png", purpose: "maskable" }),
  ]));
});


test("mobile bottom tabs navigate the application without removing help menu", async ({ page }) => {
  await page.goto("/");
  const tabs = page.getByRole("navigation", { name: "App navigation" });
  const width = page.viewportSize()?.width ?? 1280;
  if (width <= 800) {
    await expect(tabs).toBeVisible();
    await expect(tabs.getByRole("link", { name: "Home" })).toHaveAttribute("aria-current", "page");
    await tabs.getByRole("link", { name: "Explore" }).click();
    await expect(page).toHaveURL(/\/rentals$/);
    await expect(tabs.getByRole("link", { name: "Explore" })).toHaveAttribute("aria-current", "page");
    await tabs.getByRole("link", { name: "My listings" }).click();
    await expect(page).toHaveURL(/\/owner$/);
    await tabs.getByRole("link", { name: "Profile" }).click();
    await expect(page).toHaveURL(/\/profile$/);
    await expect(page.locator(".mobile-menu")).toBeVisible();
  } else {
    await expect(tabs).toBeHidden();
  }
});

test("homepage is compact and keeps search/category paths available", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("search")).toBeVisible();
  await expect(page.getByRole("heading", { name: "What brings you here?" })).toBeVisible();
  await expect(page.getByRole("link", { name: /Houses.*Room to grow/i })).toBeVisible();
  await expect(page.locator(".steps-section")).toHaveCount(0);
  await expect(page.locator(".features-strip")).toHaveCount(0);
  await expect(page.locator(".owner-section")).toHaveCount(0);
});


test("footer links form balanced rows with Privacy beside Safety, and no pilot label", async ({ page }) => {
  await page.goto("/");
  const footer = page.locator(".site-footer");
  const navigation = footer.getByRole("navigation", { name: "Footer navigation" });
  const width = page.viewportSize()?.width ?? 1280;
  if (width <= 800) {
    await expect(footer).toBeHidden();
  } else {
    await expect(footer).toBeVisible();
    const links = navigation.getByRole("link");
    await expect(links).toHaveCount(6);
    const safetyBox = await navigation.getByRole("link", { name: "Safety" }).boundingBox();
    const privacyBox = await navigation.getByRole("link", { name: "Privacy" }).boundingBox();
    expect(safetyBox && privacyBox).toBeTruthy();
    expect(Math.abs(safetyBox!.y - privacyBox!.y)).toBeLessThan(3);
    await expect(footer).toContainText("HomeTayo");
    await expect(footer).not.toContainText("Koronadal pilot");
  }
});
