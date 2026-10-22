import { describe,expect,it } from "vitest";
import fs from "node:fs";

const profile=fs.readFileSync("components/profile-picture-editor.tsx","utf8");
const start=fs.readFileSync("app/account/start/page.tsx","utf8");
const native=fs.readFileSync("apps/mobile/src/profile-settings.tsx","utf8");

describe("profile identity onboarding",()=>{
 it("offers upload photo and avatar customization on web",()=>{
  expect(profile).toContain("Upload photo");
  expect(profile).toContain("Customize avatar");
  expect(profile).toContain("profileImageMode");
 });
 it("shows first-login profile setup on web",()=>{
  expect(start).toContain("Let’s set up your profile");
  expect(start).toContain("Save profile & continue");
 });
 it("offers the same identity choices in the native app",()=>{
  expect(native).toContain("Upload photo");
  expect(native).toContain("Customize avatar");
  expect(native).toContain("Save profile & continue");
 });
});
