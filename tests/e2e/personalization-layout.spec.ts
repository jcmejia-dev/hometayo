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

test("theme changes reach profile headings, labels, icons, fields and cards together",async({page})=>{
 await page.goto("/");
 await expect(page.locator("html")).toHaveAttribute("data-theme","forest");
 await page.evaluate(()=>{const section=document.createElement("section");section.id="palette-check";section.className="profile-page";section.innerHTML='<form class="info-card profile-form"><div class="profile-section-title"><svg width="20" height="20"><path d="M0 0L20 20" stroke="currentColor"/></svg><h2>Personal settings</h2></div><label>Display name<input value="Sample"/></label></form>';document.querySelector("main")!.append(section);});
 const sample=()=>page.evaluate(()=>{const find=(selector:string,property:string)=>getComputedStyle(document.querySelector(selector)!).getPropertyValue(property);return {heading:find("#palette-check h2","color"),label:find("#palette-check label","color"),icon:find("#palette-check svg","color"),field:find("#palette-check input","background-color"),border:find("#palette-check input","border-top-color"),text:find("#palette-check input","color"),soft:find(".category-icon","background-color")};});
 const forest=await sample();
 for(const theme of ["plum","ocean"]){await page.evaluate(value=>{localStorage.setItem("hometayo.theme.v1",value);window.dispatchEvent(new StorageEvent("storage",{key:"hometayo.theme.v1",newValue:value}));},theme);await expect(page.locator("html")).toHaveAttribute("data-theme",theme);await expect.poll(async()=>JSON.stringify(await sample())).not.toBe(JSON.stringify(forest));
  // Wait for every color, not just the first property that begins transitioning.
  await expect.poll(async()=>Object.entries(await sample()).every(([key,value])=>value!==forest[key as keyof typeof forest])).toBe(true);
 }
 expect(await page.locator("#palette-check input").evaluate(el=>getComputedStyle(el).transitionDuration)).toContain("0.26s");
});
