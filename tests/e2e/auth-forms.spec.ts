import { expect, test } from "@playwright/test";

test("new authentication UI offers clear sign-in and sign-up labels", async ({page}) => {
  await page.goto("/sign-in");
  await expect(page.getByRole("heading",{name:"Sign in to HomeTayo."})).toBeVisible();
  await expect(page.getByRole("navigation",{name:"Authentication mode"}).getByRole("link",{name:"Sign in"})).toHaveAttribute("aria-current","page");
  await page.getByRole("navigation",{name:"Authentication mode"}).getByRole("link",{name:"Create account"}).click();
  await expect(page).toHaveURL(/\/sign-up$/);
  await expect(page.getByRole("heading",{name:"Create your account."})).toBeVisible();
  await expect(page.getByLabel("Full name")).toBeVisible();
  await expect(page.getByLabel("Email address")).toBeVisible();
  await expect(page.getByLabel("Password",{exact:true})).toBeVisible();
  await expect(page.getByLabel("Confirm password")).toBeVisible();
});

test("email sign-up cannot accept users without verified mail provider", async ({page}) => {
  await page.goto("/sign-up");
  await expect(page.getByText(/Email registration is not enabled yet/i)).toBeVisible();
  await expect(page.getByRole("button",{name:"Create account"})).toBeDisabled();
});

test("recovery pages make no promises before verification setup", async ({page}) => {
  await page.goto("/forgot-password");
  await expect(page.getByRole("heading",{name:"Reset your password."})).toBeVisible();
  await expect(page.getByText(/Email recovery is not enabled yet/i)).toBeVisible();
  await page.goto("/verify-email");
  await expect(page.getByText(/verification link is missing or invalid/i)).toBeVisible();
  await page.goto("/reset-password");
  await expect(page.getByText(/password reset link is missing or invalid/i)).toBeVisible();
});

test("sign-in remains usable to visitors without credentials", async ({page}) => {
  await page.goto("/sign-in");
  await expect(page.getByRole("link",{name:"Create an account"})).toBeVisible();
  await expect(page.getByRole("heading",{name:"Sign in to HomeTayo."})).toBeVisible();
});
