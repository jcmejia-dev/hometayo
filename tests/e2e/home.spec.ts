import { expect, test } from "@playwright/test";

test("home page focuses on rental search without prelaunch placeholders", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /Find a place to call home/i })).toBeVisible();
  await expect(page.locator(".eyebrow-dot, .pulse-dot")).toHaveCount(0);
  await expect(page.getByText(/Koronadal pilot|Prelaunch preview/i)).toHaveCount(0);
  await expect(page.locator(".featured-panel")).toHaveCount(1);
  await expect(page.getByRole("search")).toBeVisible();
});

test("search filters navigate to a shareable results URL", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("combobox", { name: "Property type" }).click();
  await page.getByRole("option", { name: "Whole house" }).click();
  await page.getByRole("combobox", { name: "Maximum monthly rent" }).click();
  await page.getByRole("option", { name: "Up to ₱12,000" }).click();
  await page.getByRole("combobox", { name: "Minimum bedrooms" }).click();
  await page.getByRole("option", { name: "4+ bedrooms" }).click();
  await page.getByRole("button", { name: /Search rentals/i }).click();
  await expect(page).toHaveURL(/type=house/);
  await expect(page).toHaveURL(/maxRent=12000/);
  await expect(page).toHaveURL(/bedrooms=4/);
  await expect(page.getByRole("heading", { name: /preparing the first listings/i })).toBeVisible();
});

test("no invented property listings and accessible owner route", async ({ page }) => {
  await page.goto("/rentals");
  await expect(page.getByText(/doesn't have published rentals yet/i)).toBeVisible();
  await page.getByRole("link", { name: /Own a rental/i }).click();
  await expect(page).toHaveURL(/\/owner$/);
  await expect(page.getByText(/Owner sign-in is unavailable until authentication is configured/i)).toBeVisible();
});

test("rental-request preview never claims to accept information", async ({ page }) => {
  await page.goto("/requests/new");
  await expect(page.getByText(/Requests are not being collected or saved yet/i)).toBeVisible();
});
