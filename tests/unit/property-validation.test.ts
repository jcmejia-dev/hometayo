import { strict as assert } from "node:assert";
import { describe, it } from "node:test";
import { generateSlug, propertyInputSchema, validateContact } from "../../lib/property-validation.ts";

describe("rental submission validation and contact safety", () => {
  const valid = {
    title: "Four bedroom family house",
    description: "A real example of a complete owner-provided rental description with rules.",
    propertyType: "house",
    rentalMode: "whole_unit",
    city: "Koronadal City",
    barangay: "Zone III",
    monthlyRent: "10000",
    bedrooms: "4",
    bathrooms: "2",
    availableSlots: "",
    furnished: "no",
    ownerContactKind: "none",
    ownerContactValue: "",
  };
  it("validates and converts integer PHP amounts", () => {
    const result = propertyInputSchema.safeParse(valid);
    assert.equal(result.success, true);
    if (result.success) {
      assert.equal(result.data.monthlyRent, 10000);
      assert.equal(result.data.bedrooms, 4);
      assert.equal(result.data.availableSlots, "");
    }
  });
  it("rejects malformed prices and descriptions", () => {
    assert.equal(propertyInputSchema.safeParse({ ...valid, monthlyRent: "-1" }).success, false);
    assert.equal(propertyInputSchema.safeParse({ ...valid, monthlyRent: "2.5" }).success, false);
    assert.equal(propertyInputSchema.safeParse({ ...valid, description: "Short" }).success, false);
    assert.equal(propertyInputSchema.safeParse({ ...valid, propertyType: "fake" }).success, false);
  });
  it("refuses unsafe Messenger links and unexpected contact data", () => {
    assert.equal(validateContact("none", ""), true);
    assert.equal(validateContact("none", "hidden"), false);
    assert.equal(validateContact("phone", "+639171234567"), true);
    assert.equal(validateContact("phone", "tel:javascript"), false);
    assert.equal(validateContact("messenger", "https://m.me/legitimate"), true);
    assert.equal(validateContact("messenger", "https://m.me.evil.test/redirect"), false);
    assert.equal(validateContact("messenger", "javascript:alert(1)"), false);
  });
  it("generates safe slugs", () => {
    assert.equal(generateSlug("Family Home!", "abcdef123456"), "family-home-abcdef123456");
    assert.equal(generateSlug("😄", "cafebabedead"), "rental-cafebabedead");
  });
});
