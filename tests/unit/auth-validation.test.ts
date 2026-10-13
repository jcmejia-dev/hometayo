import { strict as assert } from "node:assert";
import { describe, it } from "node:test";
import { emailSchema, passwordSchema, signUpSchema, resetSchema } from "../../lib/auth-validation.ts";

describe("HomeTayo email credentials validation", () => {
  it("normalizes email and rejects malformed addresses", () => {
    assert.equal(emailSchema.parse("Example@MAIL.COM"),"example@mail.com");
    assert.equal(emailSchema.safeParse("a@").success,false);
  });
  it("requires strong-length passwords and limits size", () => {
    assert.equal(passwordSchema.safeParse("short").success,false);
    assert.equal(passwordSchema.safeParse("a".repeat(12)).success,true);
    assert.equal(passwordSchema.safeParse("a".repeat(129)).success,false);
  });
  it("rejects mismatching confirmation fields and privileged role input", () => {
    const sample={ name:"Testing Person",email:"example@mail.com",
      password:"a secure password 123", confirmPassword:"a secure password 123" };
    assert.equal(signUpSchema.safeParse({...sample,confirmPassword:"different"}).success,false);
    const valid=signUpSchema.parse({...sample,role:"admin"});
    assert.equal("role" in valid,false);
  });
  it("validates reset tokens and confirmation", () => {
    assert.equal(resetSchema.safeParse({
      token:"abc",password:"hello strong password",confirmPassword:"hello strong password",
    }).success,false);
  });
});
