import { expect,test } from "@playwright/test";

test("public rental JSON does not expose private user, password or admin data",async ({request})=>{
  const response=await request.get("/api/public/listings?city=Koronadal%20City");
  const body=await response.json();
  expect([200,503]).toContain(response.status());
  expect(response.headers()["cache-control"]).toContain("no-store");
  expect(body.listings).toEqual(expect.any(Array));
  if(response.status()===200) {
    expect(body.state).toBe("ready");
    for(const row of body.listings){
      expect(row).toHaveProperty("slug");
      expect(row).toHaveProperty("monthlyRentCentavos");
      expect(row).not.toHaveProperty("ownerId");
      expect(row).not.toHaveProperty("ownerContactValue");
      expect(row).not.toHaveProperty("email");
      expect(row).not.toHaveProperty("role");
    }
  }else expect(body.state).toBe("unavailable");
});

test("public listing detail rejects invalid or unknown slugs",async ({request})=>{
  const response=await request.get("/api/public/listings/definitely-not-a-real-listing-id");
  expect(response.status()).toBe(404);
  const body=await response.json();
  expect(body).toMatchObject({message:"Listing not found"});
});
