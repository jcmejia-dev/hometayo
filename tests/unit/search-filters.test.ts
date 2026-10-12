import { strict as assert } from "node:assert";
import { describe, it } from "node:test";
import { parseRentalFilters, formatRent } from "../../lib/search-filters.ts";

describe("public rental search input validation", () => {
  it("defaults to Koronadal", () => {
    assert.deepEqual(parseRentalFilters({}), { city: "Koronadal City" });
  });
  it("parses allowed types and amounts without floating point currency", () => {
    assert.deepEqual(parseRentalFilters({ city: "Banga", type: "house", maxRent: "12000", bedrooms: "4" }), {
      city: "Banga", type: "house", maxRentCentavos: 1200000, minBedrooms: 4,
    });
  });
  it("rejects unexpected filters", () => {
    assert.deepEqual(parseRentalFilters({ type: "javascript:alert(1)", maxRent: "-1", bedrooms: "100" }), { city: "Koronadal City" });
  });
  it("formats Philippine peso", () => {
    assert.match(formatRent(350000), /3,500/);
  });
});
