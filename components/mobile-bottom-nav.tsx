"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Compass, House, LayoutDashboard, UserRound,MessageCircle,BookOpen } from "lucide-react";

function roleTabs(role:string|null){return [
  { href: "/", label: "Home", icon: House },
  { href: "/rentals", label: "Explore", icon: Compass },
  role==="landlord"?{ href: "/owner", label: "My listings", icon: LayoutDashboard }:role?{href:"/inbox",label:"Messages",icon:MessageCircle}:{href:"/how-it-works",label:"Guide",icon:BookOpen},
  { href: "/profile", label: "Profile", icon: UserRound },
];}

/** Four primary routes are always available without a menu on small screens.
 *  The existing top menu still exposes guides, safety and the privacy policy.
 */
export function MobileBottomNav({role=null}:{role?:string|null}) {
  const pathname = usePathname();
  if ((!role&&pathname==="/")||["/sign-in", "/sign-up", "/account/start", "/download"].includes(pathname)) return null;
  return (
    <nav className="app-bottom-nav" aria-label="App navigation">
      {roleTabs(role).map(({ href, label, icon: Icon }) => {
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
