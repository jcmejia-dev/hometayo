import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "HomeTayo — Find a place to call home",
    short_name: "HomeTayo",
    description: "Rental discovery for Filipino homes and communities.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#f7f6f1",
    theme_color: "#173d32",
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
      { src: "/pwa-icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/pwa-icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/pwa-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
