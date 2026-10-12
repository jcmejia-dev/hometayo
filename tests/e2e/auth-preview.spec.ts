import { expect, test } from "@playwright/test";

test("auth screens do not offer live login before secret configuration", async ({ page }) => {
  await page.goto("/sign-in");
  await expect(page.getByRole("heading", { name: /Sign in to manage your rentals/i })).toBeVisible();
  await expect(page.getByText(/Google login is awaiting owner setup/i)).toBeVisible();
  await expect(page.getByRole("button", { name: /Continue with Google/i })).toHaveCount(0);
});

test("owner submissions remain blocked without configured Google OAuth", async ({ page }) => {
  await page.goto("/owner/listings/new");
  await expect(page.getByText(/Google sign-in setup is required/i)).toBeVisible();
  await expect(page.locator("form.owner-form")).toHaveCount(0);
});

test("admin dashboard is hidden without an authenticated moderator", async ({ page }) => {
  const response = await page.goto("/admin");
  expect(response?.status()).toBe(404);
});


test("logged-out owner screen does not expose a sign-out control", async ({ page }) => {
  await page.goto("/owner");
  await expect(page.getByRole("button", { name: "Sign out" })).toHaveCount(0);
});
