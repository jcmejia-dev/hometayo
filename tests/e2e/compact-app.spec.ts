import { expect, test } from "@playwright/test";

test("compact homepage prioritizes the search and keeps instructions accessible", async ({page}) => {
  await page.goto("/");
  await expect(page.getByRole("search")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Find your fit." })).toBeVisible();
  await expect(page.getByRole("heading", { name: "What brings you here?" })).toBeVisible();
  await expect(page.locator(".steps-section")).toHaveCount(0);
  await expect(page.locator(".owner-section")).toHaveCount(0);
});

test("mobile app bar navigates through primary destinations", async ({page}) => {
  await page.goto("/");
  const nav = page.getByRole("navigation", {name:"App navigation"});
  if (page.viewportSize()!.width > 800) {
    await expect(nav).toBeHidden();
    return;
  }
  await expect(nav).toBeVisible();
  await expect(nav.getByRole("link", {name:"Home"})).toHaveAttribute("aria-current","page");
  await nav.getByRole("link", {name:"Explore"}).click();
  await expect(page).toHaveURL(/\/rentals$/);
  await expect(page.getByRole("navigation", {name:"App navigation"}).getByRole("link",{name:"Explore"})).toHaveAttribute("aria-current","page");
  await nav.getByRole("link", {name:"List"}).click();
  await expect(page).toHaveURL(/\/owner$/);
});

test("guest permissions are unchanged in the compact app", async ({page}) => {
  const response = await page.goto("/admin");
  expect(response?.status()).toBe(404);
});
