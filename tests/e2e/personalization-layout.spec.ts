import {test,expect} from "@playwright/test";
test("home keeps search separate and footer links grouped without horizontal overflow",async({page,isMobile})=>{
 await page.goto("/");await expect(page.getByRole("heading",{level:1})).toBeVisible();
 await expect(page.locator(".hero-copy").getByRole("search")).toHaveCount(0);
 await expect(page.locator(".home-search").getByRole("search")).toBeVisible();
 await expect(page.getByRole("combobox",{name:"Property type",exact:true})).toContainText("All property types");
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 if(!isMobile){await expect(page.getByRole("navigation",{name:"Footer navigation"})).toBeVisible();expect(await page.locator(".footer-layout .footer-identity").evaluate(el=>getComputedStyle(el).gridArea)).toBe("auto");}
});
test("saved accent persists through page navigation and reduced motion disables entrance animation",async({page})=>{
 await page.addInitScript(()=>localStorage.setItem("hometayo.theme.v1","ocean"));
 await page.emulateMedia({reducedMotion:"reduce"});await page.goto("/");
 await expect(page.locator("html")).toHaveAttribute("data-theme","ocean");
 expect(await page.locator(".page-transition").evaluate(el=>getComputedStyle(el).animationName)).toBe("none");
 await page.locator(".welcome-entry-actions").getByRole("link",{name:"Sign in",exact:true}).click();
 await expect(page).toHaveURL(/sign-in/);await expect(page.locator("html")).toHaveAttribute("data-theme","ocean");
});
