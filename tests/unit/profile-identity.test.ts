import {strict as assert} from "node:assert";
import fs from "node:fs";
import {describe,it} from "node:test";

const profile=fs.readFileSync("components/profile-picture-editor.tsx","utf8");
const start=fs.readFileSync("app/account/start/page.tsx","utf8");
const native=fs.readFileSync("apps/mobile/src/profile-settings.tsx","utf8");

describe("profile identity onboarding",()=>{
 it("offers upload photo and avatar customization on web",()=>{
  assert.match(profile,/Upload photo/);
  assert.match(profile,/Customize avatar/);
  assert.match(profile,/profileImageMode/);
 });
 it("shows first-login profile setup on web",()=>{
  assert.match(start,/Let’s set up your profile/);
  assert.match(start,/Save profile & continue/);
 });
 it("offers the same identity choices in the native app",()=>{
  assert.match(native,/Upload photo/);
  assert.match(native,/Customize avatar/);
  assert.match(native,/Save profile & continue/);
 });
});
