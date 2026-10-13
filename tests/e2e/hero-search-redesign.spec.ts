import { expect, test } from "@playwright/test";

test("hero uses a labeled marketplace UI preview rather than cartoon artwork", async ({ page }) => {
  await page.goto("/");
  const preview = page.locator(".market-preview-wrap");
  if (page.viewportSize()!.width <= 850) {
    // The large illustrative panel is intentionally hidden in the app-style mobile layout.
    await expect(preview).toBeHidden();
  } else {
    await expect(preview).toBeVisible();
    await expect(preview.getByText("INTERFACE PREVIEW")).toBeVisible();
    await expect(preview.getByText("Sample family home")).toBeVisible();
    await expect(preview.getByText(/no sample property is available for rent/i)).toBeVisible();
  }
  await expect(page.locator(".hero-art")).toHaveCount(0);
  await expect(preview.locator('a[href^="/rentals/"]')).toHaveCount(0);
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
