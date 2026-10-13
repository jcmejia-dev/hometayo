import { expect, test } from "@playwright/test";

// Override global storage used by ordinary legacy browsing tests.
test.use({ storageState:{ cookies:[],origins:[] } });

test("new guests see optional native-style intro and can browse without an account",async ({page})=>{
  await page.goto("/");
  const intro=page.getByRole("dialog",{name:"Welcome to HomeTayo"});
  await expect(intro).toBeVisible();
  await expect(intro.getByRole("heading",{name:"Find your next home"})).toBeVisible();
  await intro.getByRole("button",{name:"Next"}).click();
  await expect(intro.getByRole("heading",{name:"Search on your terms"})).toBeVisible();
  await intro.getByRole("button",{name:"Next"}).click();
  await expect(intro.getByRole("heading",{name:"Have a place to rent?"})).toBeVisible();
  await intro.getByRole("button",{name:"Get started"}).click();
  await expect(intro.getByRole("heading",{name:"Your next chapter starts here."})).toBeVisible();
  await intro.getByRole("button",{name:"Explore as guest"}).click();
  await expect(intro).toBeHidden();
  await expect(page.getByRole("search")).toBeVisible();
  expect(await page.evaluate(()=>localStorage.getItem("hometayo.intro.v1"))).toBe("done");
  await page.reload();
  await expect(intro).toBeHidden();
});

test("new guests can skip tutorial and replay it later",async ({page})=>{
  await page.goto("/");
  const intro=page.getByRole("dialog",{name:"Welcome to HomeTayo"});
  await expect(intro).toBeVisible();
  await intro.getByRole("button",{name:"Skip introduction"}).click();
  await expect(intro).toBeHidden();
  await page.goto("/how-it-works");
  await page.getByRole("link",{name:"Replay the introduction"}).click();
  await expect(page).toHaveURL(/intro=1/);
  await expect(intro).toBeVisible();
  await intro.getByRole("button",{name:"Skip introduction"}).click();
});

test("welcome screen offers both auth flows without forcing them",async ({page})=>{
  await page.goto("/");
  const dialog=page.getByRole("dialog",{name:"Welcome to HomeTayo"});
  for(let i=0;i<3;i++)await dialog.getByRole("button",{name:i===2?"Get started":"Next"}).click();
  await expect(dialog.getByRole("link",{name:"Create account"})).toHaveAttribute("href","/sign-up");
  await expect(dialog.getByRole("link",{name:"Sign in"})).toHaveAttribute("href","/sign-in");
  await expect(dialog.getByRole("button",{name:"Explore as guest"})).toBeVisible();
});
