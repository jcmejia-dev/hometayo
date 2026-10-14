import { expect, test } from "@playwright/test";

test.use({ storageState:{cookies:[],origins:[]}, reducedMotion:"reduce" });

test("website introduces the product and offers authentication and Android installation", async ({page}) => {
  await page.goto("/");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(page.getByRole("heading", {name:"A home for renters. A place for your rental."})).toBeVisible();
  await expect(page.getByRole("link", {name:"Join as a renter"})).toHaveAttribute("href", "/sign-up?audience=renter");
  await expect(page.getByRole("link", {name:"Join as a property owner"})).toHaveAttribute("href", "/sign-up?audience=owner");
  await expect(page.locator(".welcome-entry-actions").getByRole("link", {name:"Install Android app"})).toHaveAttribute("href", "/download");
  await page.locator(".welcome-entry-actions").getByRole("link", {name:"Get started"}).click();
  await expect(page).toHaveURL(/\/sign-up$/);
  await expect(page.getByRole("heading", {name:"Create account", exact:true})).toBeVisible();
  await expect(page.locator(".web-auth-story")).toContainText("choose renter or property owner");
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
  await page.screenshot({path:`test-results/web-auth-${test.info().project.name}.png`,fullPage:true});
});

test("account experience selection requires an authenticated account", async ({page}) => {
  await page.goto("/account/start?audience=owner");
  await expect(page).toHaveURL(/\/sign-in$/);
  await expect(page.getByRole("heading", {name:"Sign in",exact:true})).toBeVisible();
});
