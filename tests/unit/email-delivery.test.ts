import {test} from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import ts from "typescript";
import {emailDeliveryConfig} from "../../lib/email-delivery-config.ts";

const gmail={AUTH_EMAIL_PROVIDER:"gmail",GMAIL_USER:" Example@gmail.com ",GMAIL_APP_PASSWORD:"abcd efgh ijkl mnop"};
test("Gmail normalizes app-password spacing and always sends from its authenticated account",()=>{
  assert.deepEqual(emailDeliveryConfig({...gmail,AUTH_EMAIL_FROM:"Someone <other@example.test>"}),{provider:"gmail",user:"example@gmail.com",password:"abcdefghijklmnop",from:"HomeTayo <example@gmail.com>"});
});
test("missing/invalid Gmail settings fail closed without silently falling back to Resend",()=>{
  for(const invalid of [{GMAIL_APP_PASSWORD:""},{GMAIL_APP_PASSWORD:"normal-password"},{GMAIL_USER:"user@example.test"},{GMAIL_USER:"user@gmail.com\r\nBcc: attacker@gmail.com"}]){
    assert.equal(emailDeliveryConfig({...gmail,...invalid,RESEND_API_KEY:"test-only",AUTH_EMAIL_FROM:"x@example.test"}),null);
  }
  assert.equal(emailDeliveryConfig({AUTH_EMAIL_PROVIDER:"unknown"}),null);
  assert.equal(emailDeliveryConfig({}),null);
  assert.equal(emailDeliveryConfig({RESEND_API_KEY:"test-only",AUTH_EMAIL_FROM:"x@example.test"})?.provider,"resend");
});
test("Gmail transport uses TLS, pins the sender, and hides provider errors",async()=>{
  let settings:Record<string,unknown>={},sent:Record<string,unknown>={};
  let fail=false;
  const source=readFileSync(new URL("../../lib/email-delivery.ts",import.meta.url),"utf8");
  const compiled=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,esModuleInterop:true}}).outputText;
  const exports:Record<string,(message:Record<string,string>)=>Promise<void>>={};
  const mockRequire=(name:string)=>{
    if(name==="server-only")return {};
    if(name==="./email-delivery-config")return {emailDeliveryConfig:()=>emailDeliveryConfig(gmail)};
    if(name==="nodemailer")return {createTransport:(options:Record<string,unknown>)=>{settings=options;return {sendMail:async(message:Record<string,unknown>)=>{sent=message;if(fail)throw Error("secret-provider-detail");return {accepted:[message.to]};}};}};
    throw Error("Unexpected dependency");
  };
  new Function("require","exports",compiled)(mockRequire,exports);
  const message={to:"recipient@example.test",subject:"Test only",html:"<p>Test</p>",text:"Test"};
  await exports.deliverAccountEmail(message);
  assert.equal(settings.host,"smtp.gmail.com");assert.equal(settings.port,465);assert.equal(settings.secure,true);
  assert.equal(settings.disableFileAccess,true);assert.equal(settings.disableUrlAccess,true);
  assert.equal(sent.from,"HomeTayo <example@gmail.com>");assert.equal(sent.to,message.to);assert.equal(sent.text,message.text);
  fail=true;
  await assert.rejects(exports.deliverAccountEmail(message),{message:"Email could not be delivered. Please try again later."});
});
test("existing Resend configuration still delivers through its API without SMTP",async()=>{
  const compiled=ts.transpileModule(readFileSync(new URL("../../lib/email-delivery.ts",import.meta.url),"utf8"),{compilerOptions:{module:ts.ModuleKind.CommonJS,esModuleInterop:true}}).outputText;
  const exports:Record<string,(message:Record<string,string>)=>Promise<void>>={};
  const mockRequire=(name:string)=>{
    if(name==="server-only"||name==="nodemailer")return {};
    if(name==="./email-delivery-config")return {emailDeliveryConfig:()=>emailDeliveryConfig({RESEND_API_KEY:"test-only",AUTH_EMAIL_FROM:"HomeTayo <hello@example.test>"})};
    throw Error("Unexpected dependency");
  };
  let body:Record<string,unknown>={};
  const mockFetch=async(url:string,options:{body:string})=>{assert.equal(url,"https://api.resend.com/emails");body=JSON.parse(options.body);return {ok:true};};
  new Function("require","exports","fetch",compiled)(mockRequire,exports,mockFetch);
  await exports.deliverAccountEmail({to:"recipient@example.test",subject:"Test only",html:"<p>Test</p>",text:"Test"});
  assert.deepEqual(body.to,["recipient@example.test"]);assert.equal(body.from,"HomeTayo <hello@example.test>");
});
