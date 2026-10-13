import { expect, test } from "@playwright/test";

test("home discovery shows real approved listings or a transparent empty state", async ({ page }) => {
  await page.goto("/");
  const featured = page.locator(".featured-wrap");
  await expect(featured).toHaveCount(1);
  const width = page.viewportSize()?.width ?? 1280;
  if (width <= 850) {
    await expect(featured).toBeHidden();
  } else {
    await expect(featured).toBeVisible();
    await expect(featured.getByRole("heading", { name: "Recently added rentals" })).toBeVisible();
  }
  await expect(page.getByText("Sample family home")).toHaveCount(0);
  await expect(page.getByText("Sample cozy room")).toHaveCount(0);
  await expect(page.getByText("INTERFACE PREVIEW")).toHaveCount(0);
  await expect(page.locator(".market-preview-card")).toHaveCount(0);
  await expect(featured.getByRole("link", { name: /Browse rentals/i })).toHaveCount(1);
});

test("custom rental dropdown is branded, keyboard accessible, and dismissible", async ({ page }) => {
  await page.goto("/");
  const budget = page.getByRole("combobox", { name: "Maximum monthly rent" });
  await expect(budget).toBeVisible();
  await budget.focus();
  await page.keyboard.press("Enter");
  const defaultOption = page.getByRole("option", { name: "Any price" });
  await expect(defaultOption).toBeVisible();
  await expect(page.locator(".search-select-content")).toBeVisible();
  await expect(page.getByRole("option", { name: "Up to ₱12,000" })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(defaultOption).toHaveCount(0);
});

test("rental search filters are kept on results page after selecting values", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("combobox", { name: "Property type" }).click();
  await page.getByRole("option", { name: "Apartment" }).click();
  await page.getByRole("combobox", { name: "Maximum monthly rent" }).click();
  await page.getByRole("option", { name: "Up to ₱8,000" }).click();
  await page.getByRole("button", { name: "Search rentals" }).click();
  await expect(page).toHaveURL(/type=apartment/);
  await expect(page).toHaveURL(/maxRent=8000/);
  await expect(page.getByRole("combobox", { name: "Property type" })).toContainText("Apartment");
  await expect(page.getByRole("combobox", { name: "Maximum monthly rent" })).toContainText("Up to ₱8,000");
});
