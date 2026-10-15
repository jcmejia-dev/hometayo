import {ANDROID_APK_URL} from "@/lib/android-release";
export const runtime="nodejs";
export const dynamic="force-dynamic";
export const maxDuration=300;
async function download(request:Request,head=false){
  const range=request.headers.get("range");
  if(range&&!/^bytes=(?:\d+-\d*|-\d+)$/.test(range))return new Response(null,{status:416});
  try{
    const sourceHeaders=new Headers();
    if(range){sourceHeaders.set("Range",range);if(request.headers.has("if-range"))sourceHeaders.set("If-Range",request.headers.get("if-range")!);}
    const upstream=await fetch(ANDROID_APK_URL,{method:head?"HEAD":"GET",cache:"no-store",headers:sourceHeaders,signal:AbortSignal.any([request.signal,AbortSignal.timeout(280000)])});
    if(upstream.status===416)return new Response(null,{status:416,headers:{"Cache-Control":"no-store",...(upstream.headers.has("content-range")?{"Content-Range":upstream.headers.get("content-range")!}:{})}});
    if(![200,206].includes(upstream.status)||(!head&&!upstream.body)){await upstream.body?.cancel();throw Error("APK unavailable");}
    const headers=new Headers({"Content-Type":"application/vnd.android.package-archive","Content-Disposition":"attachment; filename=\"HomeTayo.apk\"; filename*=UTF-8''HomeTayo.apk","Cache-Control":"no-store","X-Content-Type-Options":"nosniff","Accept-Ranges":"bytes"});
    for(const name of ["content-length","content-range","etag","last-modified"])if(upstream.headers.has(name))headers.set(name,upstream.headers.get(name)!);
    // Stream the original signed APK unchanged. Never buffer an 80 MB APK in a function.
    return new Response(head?null:upstream.body,{status:upstream.status,headers});
  }catch{return new Response("Download temporarily unavailable. Please retry from the HomeTayo download page.",{status:503,headers:{"Cache-Control":"no-store","Content-Type":"text/plain; charset=utf-8"}});}
}
export const GET=(request:Request)=>download(request);
export const HEAD=(request:Request)=>download(request,true);
