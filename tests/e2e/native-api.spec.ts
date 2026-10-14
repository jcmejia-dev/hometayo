import {test,expect} from "@playwright/test";
test("unconfigured native auth fails closed and never returns a token",async({request})=>{
  const response=await request.post("/api/mobile/auth",{data:{action:"login",email:"example@example.test",password:"not-a-real-password"}});
  expect(response.status()).toBe(503);
  expect(await response.json()).not.toHaveProperty("token");
});
test("native private routes require authentication",async({request})=>{
  for(const route of ["/api/mobile/listings","/api/mobile/places?q=KCC"]){const response=await request.get(route);expect(response.status()).toBe(401);}
  expect((await request.post("/api/mobile/listings",{data:{ownerId:"another-user"}})).status()).toBe(401);
  expect((await request.patch("/api/mobile/listings",{data:{id:"00000000-0000-4000-8000-000000000001",latitude:6,longitude:124}})).status()).toBe(401);
});
test("map API rejects partial and invalid coordinates before querying storage",async({request})=>{
  for(const query of ["lat=0","lat=91&lng=0","lat=0&lng=0&radiusKm=500"]){const response=await request.get("/api/public/listings?map=1&"+query);expect(response.status()).toBe(400);}
});
