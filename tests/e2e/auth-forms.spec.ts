import { expect, test } from "@playwright/test";

test("password visibility preserves both values and never submits the form",async({page})=>{
  await page.goto("/reset-password?token="+"x".repeat(43));
  const password=page.getByLabel("New password",{exact:true});
  const confirm=page.getByLabel("Confirm new password",{exact:true});
  await password.fill("example-password-123");
  await confirm.fill("confirmation-password-123");
  await page.getByRole("button",{name:"Show new password",exact:true}).click();
  await expect(password).toHaveAttribute("type","text");
  await expect(password).toHaveValue("example-password-123");
  await expect(confirm).toHaveAttribute("type","password");
  await page.getByRole("button",{name:"Hide new password",exact:true}).click();
  await expect(password).toHaveAttribute("type","password");
  await page.getByRole("button",{name:"Show confirm new password",exact:true}).click();
  await expect(confirm).toHaveAttribute("type","text");
  await expect(confirm).toHaveValue("confirmation-password-123");
  await expect(page.getByRole("button",{name:"Update password"})).toBeEnabled();
});

test("compact sign-in shows the exact requested fields and navigation",async ({page})=>{
  await page.goto("/sign-in");
  await expect(page.getByRole("heading",{name:"Sign in",exact:true})).toBeVisible();
  await expect(page.locator(".auth-layout")).toBeVisible();
  await expect(page.locator(".auth-editorial")).toHaveCount(0);
  await expect(page.getByLabel("Email address")).toBeVisible();
  await expect(page.getByLabel("Password",{exact:true})).toBeVisible();
  await expect(page.getByRole("button",{name:"Sign in",exact:true})).toBeDisabled();
  await expect(page.getByText(/Email sign-in is not available yet/)).toBeVisible();
  await page.locator(".auth-switch-note").getByRole("link",{name:"Create account"}).click();
  await expect(page).toHaveURL(/\/sign-up$/);
  await expect(page.getByRole("heading",{name:"Create account",exact:true})).toBeVisible();
});

test("signup is compact and unavailable email registration cannot be submitted",async ({page})=>{
  await page.goto("/sign-up");
  await expect(page.getByLabel("Full name")).toBeVisible();
  await expect(page.getByLabel("Email address")).toBeVisible();
  await expect(page.getByLabel("Password",{exact:true})).toBeVisible();
  await expect(page.getByLabel("Confirm password",{exact:true})).toBeVisible();
  await expect(page.getByRole("button",{name:"Create account"})).toBeDisabled();
  await expect(page.getByText(/Email registration is not available yet/)).toBeVisible();
  await page.locator(".auth-switch-note").getByRole("link",{name:"Sign in",exact:true}).click();
  await expect(page).toHaveURL(/\/sign-in$/);
});

test("recovery pages remain available without exposing a usable reset form",async ({page})=>{
  await page.goto("/forgot-password");
  await expect(page.getByRole("heading",{name:"Reset your password."})).toBeVisible();
  await expect(page.getByText(/Email recovery is not enabled yet/i)).toBeVisible();
  await page.goto("/verify-email");
  await expect(page.getByText(/verification link is missing or invalid/i)).toBeVisible();
  await page.goto("/reset-password");
  await expect(page.getByText(/password reset link is missing or invalid/i)).toBeVisible();
});

test("guests can still browse listings without creating an account",async ({page})=>{
  await page.goto("/sign-in");
  await page.getByRole("link",{name:/Explore rentals without an account/i}).click();
  await expect(page).toHaveURL(/\/rentals$/);
});
