import { expect, test } from "@playwright/test";

test("Android download page fits the screen and offers web browsing with the published APK", async ({ page }, testInfo) => {
  await page.goto("/download");
  await expect(page.getByRole("region", { name: "Android app installation" }).getByRole("link", { name: "Install Android app", exact: true })).toHaveAttribute("href", "https://expo.dev/artifacts/eas/dmizjeLsDTjxBcMPFt_GF_gWYQ5Hh71MQj-QRoHdlRs.apk");
  await expect(page.getByRole("link", { name: "Explore rentals on the web" })).toHaveAttribute("href", "/rentals");
  await page.screenshot({path:testInfo.outputPath("android-download.png"),fullPage:true});
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});
