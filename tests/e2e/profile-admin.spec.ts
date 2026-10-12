import { expect, test } from "@playwright/test";

test("a visitor can find profile settings but cannot view a private account", async ({ page }) => {
  await page.goto("/");
  const navigation = page.locator(".mobile-menu");
  if (await navigation.isVisible()) {
    await navigation.locator("summary").click();
    await expect(navigation.getByRole("link", {name:"My profile"})).toBeVisible();
    await navigation.getByRole("link", {name:"My profile"}).click();
  } else {
    await page.getByRole("navigation", {name:"Primary navigation"}).getByRole("link", {name:"My profile"}).click();
  }
  await expect(page).toHaveURL(/\/profile$/);
  await expect(page.getByRole("heading",{ name: "Profile setup unavailable" })).toBeVisible();
  await expect(page.getByLabel("Google account")).toHaveCount(0);
});

test("admin operational information stays private for unauthenticated users", async ({ page }) => {
  const response = await page.goto("/admin");
  expect(response?.status()).toBe(404);
  await expect(page.getByText("Platform at a glance")).toHaveCount(0);
});

test("authenticated profile settings require a configured sign-in service", async ({ page }) => {
  await page.goto("/profile");
  await expect(page.locator("form.profile-form")).toHaveCount(0);
});
