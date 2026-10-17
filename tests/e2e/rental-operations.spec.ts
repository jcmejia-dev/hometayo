import {test,expect} from "@playwright/test";

test("private rental operations deny anonymous web and mobile requests",async({request})=>{
 for(const path of ["/api/rental-operations","/api/mobile/rental-operations","/api/owner-units?listingId=00000000-0000-4000-8000-000000000001"]){
  const r=await request.get(path);expect(r.status()).toBe(401);
 }
 const r=await request.post("/api/mobile/rental-operations",{data:{action:"payment"}});expect(r.status()).toBe(401);
});
test("web mutations require a same-origin request and public identifiers are validated",async({request})=>{
 const r=await request.post("/api/rental-operations",{headers:{Origin:"https://untrusted.invalid"},data:{action:"react",slug:"test-rental",kind:"like"}});expect(r.status()).toBe(403);
 expect((await request.get("/api/public/units?listingId=invalid")).status()).toBe(400);
 expect((await request.get("/api/reactions?slug=../../private")).status()).toBe(400);
});
test("guest inbox goes to sign in",async({page})=>{
 await page.goto("/inbox");await expect(page).toHaveURL(/\/sign-in/);
});
