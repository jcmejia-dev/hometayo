import { expect, test } from "@playwright/test";

test("Android download page fits the screen and offers web browsing before APK publication", async ({ page }) => {
  await page.goto("/download");
  await expect(page.getByRole("heading", { name: "Android download coming soon" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Install Android app", exact: true }).filter({ has: page.locator("svg") })).toHaveCount(0);
  await expect(page.getByRole("link", { name: "Explore rentals on the web" })).toHaveAttribute("href", "/rentals");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});
