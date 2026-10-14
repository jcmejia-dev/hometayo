"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Compass, House, LayoutDashboard, UserRound } from "lucide-react";

const tabs = [
  { href: "/", label: "Home", icon: House },
  { href: "/rentals", label: "Explore", icon: Compass },
  { href: "/owner", label: "My listings", icon: LayoutDashboard },
  { href: "/profile", label: "Profile", icon: UserRound },
];

/** Four primary routes are always available without a menu on small screens.
 *  The existing top menu still exposes guides, safety and the privacy policy.
 */
export function MobileBottomNav() {
  const pathname = usePathname();
  if (["/", "/sign-in", "/sign-up", "/account/start", "/download"].includes(pathname)) return null;
  return (
    <nav className="app-bottom-nav" aria-label="App navigation">
      {tabs.map(({ href, label, icon: Icon }) => {
        const active = href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(href + "/");
        return (
          <Link key={href} href={href} className={active ? "app-tab is-active" : "app-tab"} aria-current={active ? "page" : undefined}>
            <Icon size={21} strokeWidth={active ? 2.5 : 1.9} aria-hidden="true"/>
            <span>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
