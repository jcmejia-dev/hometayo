import { ImageResponse } from "next/og";
import { HomePinArtwork } from "@/components/homepin-artwork";

export const dynamic = "force-static";

export function GET() {
  return new ImageResponse(
    <div style={{ display: "flex", width: "100%", height: "100%", alignItems: "center", justifyContent: "center" }}>
      <HomePinArtwork size={512} maskable/>
    </div>,
    { width: 512, height: 512 }
  );
}
