import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { MobileBottomNav } from "@/components/mobile-bottom-nav";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "HomeTayo — Find a place to call home",
    template: "%s | HomeTayo",
  },
  description:
    "HomeTayo is building a simpler way to discover affordable rental homes, apartments, boarding houses and bedspaces in the Philippines. Starting in Koronadal.",
  applicationName: "HomeTayo",
  icons: { icon: "/icon.svg" },
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  themeColor: "#173d32",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div className="site-shell">
          <SiteHeader />
          <main id="main-content">{children}</main>
          <SiteFooter />
          <MobileBottomNav />
        </div>
      </body>
    </html>
  );
}
