import { expect, test } from "@playwright/test";

test("Android download page fits the screen and offers web browsing with the published APK", async ({ page }) => {
  await page.goto("/download");
  await expect(page.getByRole("link", { name: "Install Android app", exact: true })).toHaveAttribute("href", "https://expo.dev/artifacts/eas/dmizjeLsDTjxBcMPFt_GF_gWYQ5Hh71MQj-QRoHdlRs.apk");
  await expect(page.getByRole("link", { name: "Explore rentals on the web" })).toHaveAttribute("href", "/rentals");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});
