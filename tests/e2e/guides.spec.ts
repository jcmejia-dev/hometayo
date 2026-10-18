import { expect, test } from "@playwright/test";

test("public guide introduces renter and owner journeys", async ({ page }) => {
  await page.goto("/how-it-works");
  await page.getByRole("link", { name: /I'm looking for a home.*Step-by-step rental search/i }).click();
  await expect(page).toHaveURL(/\/how-it-works#renters$/);
  await expect(page.getByRole("heading", { name: "Renter guide" })).toBeVisible();
});

test("renter guide gives current steps and opens working search", async ({ page }) => {
  await page.goto("/how-it-works#renters");
  const guide = page.locator("#renters");
  await expect(guide.getByRole("heading", { name: "Choose a location" })).toBeVisible();
  await expect(guide.getByRole("heading", { name: "Set your budget and space" })).toBeVisible();
  await expect(guide.getByRole("heading", { name: "Review rental listings" })).toBeVisible();
  await expect(guide.getByRole("heading", { name: "Message the owner in HomeTayo" })).toBeVisible();
  await guide.getByRole("link", { name: /Browse rentals/i }).click();
  await expect(page).toHaveURL(/\/rentals$/);
  await expect(page.getByRole("search")).toBeVisible();
});

test("owner guide accurately describes the current moderation workflow", async ({ page }) => {
  await page.goto("/how-it-works#owners");
  const guide = page.locator("#owners");
  await expect(guide.getByRole("heading", { name: "Property owner guide" })).toBeVisible();
  await expect(guide.getByRole("heading", { name: "Sign in with Google" })).toBeVisible();
  await expect(guide.getByRole("heading", { name: "Publish your rental" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Can owners add photos or update listings?" })).toBeVisible();
  await guide.getByRole("link", { name: /Open owner dashboard/i }).click();
  await expect(page).toHaveURL(/\/owner$/);
});

test("contextual guidance links open the right audience section", async ({ page }) => {
  await page.goto("/rentals");
  const renterHelp = page.getByRole("complementary", { name: "Renter help" });
  await expect(renterHelp).toBeVisible();
  await renterHelp.getByRole("link", { name: "View guide" }).click();
  await expect(page).toHaveURL(/\/how-it-works#renters$/);

  await page.goto("/owner");
  const ownerHelp = page.getByRole("complementary", { name: "Owner help" });
  await expect(ownerHelp).toBeVisible();
  await ownerHelp.getByRole("link", { name: "View guide" }).click();
  await expect(page).toHaveURL(/\/how-it-works#owners$/);
});

test("the public navigation links to instructions on both screen modes", async ({ page }) => {
  await page.goto("/");
  const mobile = page.locator(".mobile-menu");
  if (await mobile.isVisible()) {
    await mobile.locator("summary").click();
    await mobile.getByRole("link", { name: "How it works" }).click();
  } else {
    await page.getByRole("navigation", { name: "Primary navigation" }).getByRole("link", { name: "How it works" }).click();
  }
  await expect(page).toHaveURL(/\/how-it-works$/);
  await expect(page.getByRole("heading", { name: "Property owner guide" })).toBeVisible();
});
