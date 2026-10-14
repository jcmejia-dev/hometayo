import { expect, test } from "@playwright/test";

test("a visitor sees sign-in navigation before private profile access", async ({ page }) => {
  await page.goto("/");
  const navigation = page.locator(".mobile-menu");
  if (await navigation.isVisible()) {
    await navigation.locator("summary").click();
    await expect(navigation.getByRole("link", {name:"Sign in"})).toBeVisible();
    await navigation.getByRole("link", {name:"Sign in"}).click();
  } else {
    await page.getByRole("navigation", {name:"Primary navigation"}).getByRole("link", {name:"Sign in"}).click();
  }
  await expect(page).toHaveURL(/\/sign-in$/);
  await expect(page.getByRole("heading",{ name: "Sign in", exact:true })).toBeVisible();
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
