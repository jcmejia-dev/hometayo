import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { MobileBottomNav } from "@/components/mobile-bottom-nav";
import {PlatformAnnouncement} from "@/components/platform-announcement";
import "./globals.css";
import "./social-upgrades.css";
import {NavigationMotion} from "@/components/navigation-motion";
import {ThemeRestore} from "@/components/theme-settings";
import {InteractionDeterrent} from "@/components/interaction-deterrent";
import {currentUser} from "@/lib/session-user";

export const metadata: Metadata = {
  title: {
    default: "HomeTayo — Find a place to call home",
    template: "%s | HomeTayo",
  },
  description:
    "HomeTayo is building a simpler way to discover affordable rental homes, apartments, boarding houses and bedspaces in the Philippines. Find places that fit your needs.",
  applicationName: "HomeTayo",
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/pwa-icon-192.png", type: "image/png", sizes: "192x192" },
    ],
    apple: [{ url: "/apple-icon", sizes: "180x180", type: "image/png" }],
  },
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  themeColor: "#173d32",
  width: "device-width",
  initialScale: 1,
};

export default async function RootLayout({ children }: { children: ReactNode }) {
  const user=await currentUser();
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <body>
        <ThemeRestore/><NavigationMotion/><InteractionDeterrent/>
        <div className="site-shell">
          <SiteHeader />
          <PlatformAnnouncement role={user?.role??null}/>
          <main id="main-content">{children}</main>
          <SiteFooter signedIn={Boolean(user)} isLandlord={user?.role==="landlord"} />
          <MobileBottomNav role={user?.role??null}/>
        </div>
      </body>
    </html>
  );
}
