import {test,expect} from "@playwright/test";
import {readFileSync} from "node:fs";
import ts from "typescript";
test("theme reveal runs a real circular browser animation and finishes cleanly",async({page})=>{
 await page.goto("/");await page.emulateMedia({reducedMotion:"no-preference"});
 const source=ts.transpileModule(readFileSync("components/theme-motion.ts","utf8"),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText;
 await page.evaluate(compiled=>{
  const output:{revealTheme?:(commit:()=>void,trigger:HTMLElement)=>void}={};
  new Function("require","exports",compiled)(()=>({flushSync:(commit:()=>void)=>commit()}),output);
  const root=document.documentElement,original=root.animate.bind(root);
  root.animate=((frames:Keyframe[],options:KeyframeAnimationOptions)=>{root.dataset.reveal=String(options.pseudoElement);return original(frames,options);}) as typeof root.animate;
  const button=document.createElement("button");button.textContent="Preview theme motion";button.type="button";button.onclick=()=>output.revealTheme!(()=>{root.dataset.theme="plum";},button);document.querySelector("main")!.prepend(button);
 },source);
 await page.getByRole("button",{name:"Preview theme motion"}).click();await expect(page.locator("html")).toHaveAttribute("data-theme","plum");await expect(page.locator("html")).toHaveAttribute("data-reveal","::view-transition-new(root)");await expect.poll(()=>page.locator("html").getAttribute("data-motion")).toBe(null);
});
