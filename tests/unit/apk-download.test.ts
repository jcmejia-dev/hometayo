import {test} from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import ts from "typescript";
function route(fetcher:(url:string,options:RequestInit)=>Promise<Response>){
  const source=readFileSync(new URL("../../app/download/HomeTayo.apk/route.ts",import.meta.url),"utf8");
  const code=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText;
  const exports:{GET?:(request:Request)=>Promise<Response>;HEAD?:(request:Request)=>Promise<Response>}={};
  new Function("require","exports","fetch",code)(()=>({ANDROID_APK_URL:"https://expo.dev/fixed-release.apk"}),exports,fetcher);
  return exports as Required<typeof exports>;
}
test("APK download sets the branded filename and preserves streamed bytes",async()=>{
  let pulled=0;
  const handler=route(async(url)=>{
    assert.equal(url,"https://expo.dev/fixed-release.apk");
    return new Response(new ReadableStream({pull(controller){if(pulled===640){controller.close();return;}pulled++;controller.enqueue(new Uint8Array(8192).fill(42));}}));
  });
  const response=await handler.GET(new Request("https://hometayo.test/download/HomeTayo.apk"));
  assert.equal(response.status,200);
  assert.match(response.headers.get("content-disposition")!,/attachment; filename="HomeTayo.apk"/);
  assert.equal(response.headers.get("content-type"),"application/vnd.android.package-archive");
  assert(pulled<640,"upstream must not be buffered before returning the response");
  const bytes=new Uint8Array(await response.arrayBuffer());
  assert.equal(bytes.length,5242880);assert(bytes.every(value=>value===42));
});
test("HEAD does not download the APK; Range and 206 headers are preserved",async()=>{
  const handler=route(async(_url,options)=>{
    if(options.method==="HEAD")return new Response(null,{headers:{"Content-Length":"84366539"}});
    assert.equal(new Headers(options.headers).get("range"),"bytes=0-3");
    return new Response(new Uint8Array([80,75,3,4]),{status:206,headers:{"Content-Range":"bytes 0-3/84366539","Content-Length":"4"}});
  });
  const head=await handler.HEAD(new Request("https://hometayo.test/download/HomeTayo.apk"));
  assert.equal(head.body,null);assert.equal(head.headers.get("content-length"),"84366539");
  const partial=await handler.GET(new Request("https://hometayo.test/download/HomeTayo.apk",{headers:{Range:"bytes=0-3"}}));
  assert.equal(partial.status,206);assert.equal(partial.headers.get("content-range"),"bytes 0-3/84366539");
  assert.deepEqual([...new Uint8Array(await partial.arrayBuffer())],[80,75,3,4]);
});
test("invalid ranges and upstream failures never become a fake APK download",async()=>{
  let calls=0;
  const handler=route(async()=>{calls++;return new Response("upstream detail",{status:404});});
  const bad=await handler.GET(new Request("https://hometayo.test/download/HomeTayo.apk",{headers:{Range:"bytes=0-3,9-12"}}));
  assert.equal(bad.status,416);assert.equal(calls,0);
  const failed=await handler.GET(new Request("https://hometayo.test/download/HomeTayo.apk"));
  assert.equal(failed.status,503);assert.equal(failed.headers.get("content-disposition"),null);
  assert(!(await failed.text()).includes("upstream detail"));
});
