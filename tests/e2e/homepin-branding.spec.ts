import { expect, test } from "@playwright/test";

test("HomeTayo uses its house-and-location-pin brand in the UI", async ({ page }) => {
  await page.goto("/");
  const brand = page.getByRole("link", { name: "HomeTayo home" }).first();
  await expect(brand).toBeVisible();
  await expect(brand).toContainText("HomeTayo");
  const image = await brand.locator(".brand-icon").evaluate((node) => getComputedStyle(node).backgroundImage);
  expect(image).toContain("/icon.svg");
  const svg = await page.request.get("/icon.svg");
  expect(svg.ok()).toBeTruthy();
  expect(svg.headers()["content-type"]).toContain("image/svg+xml");
  const body = await svg.text();
  expect(body).toContain("house and location pin");
  expect(body).toContain("#196247");
  expect(body).not.toContain("HomePini");
});

test("HomeTayo PWA PNG icons render in the correct sizes", async ({ request }) => {
  const images = [
    { url: "/pwa-icon-192.png", size: 192 },
    { url: "/pwa-icon-512.png", size: 512 },
    { url: "/pwa-maskable-512.png", size: 512 },
    { url: "/apple-icon", size: 180 },
  ];
  for (const image of images) {
    const response = await request.get(image.url);
    expect(response.ok(), image.url).toBeTruthy();
    expect(response.headers()["content-type"], image.url).toContain("image/png");
    const data = await response.body();
    expect(data.subarray(0, 8).toString("hex"), image.url).toBe("89504e470d0a1a0a");
    expect(data.readUInt32BE(16), image.url).toBe(image.size);
    expect(data.readUInt32BE(20), image.url).toBe(image.size);
  }
});

test("PWA display name remains HomeTayo, not its icon concept", async ({ request }) => {
  const response = await request.get("/manifest.webmanifest");
  expect(response.ok()).toBeTruthy();
  const manifest = await response.json();
  expect(manifest.short_name).toBe("HomeTayo");
  expect(manifest.name).toContain("HomeTayo");
  expect(JSON.stringify(manifest)).not.toContain("HomePini");
});
