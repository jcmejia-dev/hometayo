import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { ReactElement } from "react";

// Embed the approved artwork so generated metadata images need no network request.
const artwork = "data:image/png;base64," + readFileSync(join(process.cwd(), "public/brand-logo.png")).toString("base64");

export function HomePinArtwork({size=512,maskable=false}:{size?:number;maskable?:boolean}):ReactElement {
  return <div style={{display:"flex",width:size,height:size,backgroundColor:"#073c29",alignItems:"center",justifyContent:"center"}}>
    {/* Extra inset keeps both houses inside circular launcher masks. */}
    {/* eslint-disable-next-line @next/next/no-img-element -- ImageResponse requires a native img. */}
    <img src={artwork} alt="HomeTayo connected homes" width={maskable?size*.8:size} height={maskable?size*.8:size}/>
  </div>;
}
