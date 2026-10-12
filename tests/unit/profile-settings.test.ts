import { strict as assert } from "node:assert";
import { describe, it } from "node:test";
import { profileSettingsSchema } from "../../lib/profile-settings.ts";

describe("HomeTayo profile settings", () => {
  it("allows empty optional preferences", () => {
    assert.equal(profileSettingsSchema.safeParse({
      preferredName: "", homeCity: "", preferredPropertyType: "", preferredBudgetPesos: "",
    }).success, true);
  });
  it("accepts sensible renter preferences and converts integer budgets", () => {
    const result = profileSettingsSchema.safeParse({
      preferredName: "Renter JC", homeCity: "Koronadal City",
      preferredPropertyType: "house", preferredBudgetPesos: "12000",
    });
    assert.equal(result.success,true);
    if (result.success) assert.equal(result.data.preferredBudgetPesos, 12000);
  });
  it("rejects invalid types and personal-information spam", () => {
    const base = { preferredName: "Sample", homeCity: "Koronadal City",
      preferredPropertyType: "house", preferredBudgetPesos: "12000" };
    assert.equal(profileSettingsSchema.safeParse({...base,preferredPropertyType:"admin"}).success,false);
    assert.equal(profileSettingsSchema.safeParse({...base,preferredBudgetPesos:"-1"}).success,false);
    assert.equal(profileSettingsSchema.safeParse({...base,preferredBudgetPesos:"2.5"}).success,false);
    assert.equal(profileSettingsSchema.safeParse({...base,preferredName:"X".repeat(81)}).success,false);
  });
});
