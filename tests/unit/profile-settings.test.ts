import { strict as assert } from "node:assert";
import { describe, it } from "node:test";
import { avatarConfigSchema, profileSettingsSchema } from "../../lib/profile-settings.ts";

const avatar={skin:"#E8B894",hair:"waves",hairColor:"#171717",outfit:"#1F6F50",background:"#DFF4E8",expression:"smile"} as const;

describe("HomeTayo profile settings", () => {
  it("allows empty optional preferences for older clients", () => {
    assert.equal(profileSettingsSchema.safeParse({preferredName:"",homeCity:"",preferredPropertyType:"",preferredBudgetPesos:""}).success,true);
  });
  it("accepts sensible renter preferences and a custom avatar", () => {
    const result=profileSettingsSchema.safeParse({preferredName:"Renter JC",homeCity:"Koronadal City",preferredPropertyType:"house",preferredBudgetPesos:"12000",avatarConfig:avatar});
    assert.equal(result.success,true);
    if(result.success)assert.equal(result.data.preferredBudgetPesos,12000);
  });
  it("rejects unsupported avatar parts",()=>{
    assert.equal(avatarConfigSchema.safeParse({...avatar,hair:"laser-hair"}).success,false);
    assert.equal(avatarConfigSchema.safeParse({...avatar,skin:"transparent"}).success,false);
  });
  it("rejects invalid types and personal-information spam", () => {
    const base={preferredName:"Sample",homeCity:"Koronadal City",preferredPropertyType:"house",preferredBudgetPesos:"12000",avatarConfig:avatar};
    assert.equal(profileSettingsSchema.safeParse({...base,preferredPropertyType:"admin"}).success,false);
    assert.equal(profileSettingsSchema.safeParse({...base,preferredBudgetPesos:"-1"}).success,false);
    assert.equal(profileSettingsSchema.safeParse({...base,preferredBudgetPesos:"2.5"}).success,false);
    assert.equal(profileSettingsSchema.safeParse({...base,preferredName:"X".repeat(81)}).success,false);
  });
});
