"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { House, Search, PlusSquare, CircleUserRound } from "lucide-react";

const tabs = [
  { href: "/", label: "Home", icon: House },
  { href: "/rentals", label: "Explore", icon: Search },
  { href: "/owner", label: "List", icon: PlusSquare },
  { href: "/profile", label: "Profile", icon: CircleUserRound },
];

/* Four persistent primary destinations; secondary help/safety links stay in
 * the header's expandable menu. The admin route is never advertised to guests. */
export function MobileAppNav() {
  const pathname = usePathname();
  return (
    <nav className="app-bottom-nav" aria-label="App navigation">
      {tabs.map(({href,label,icon:Icon}) => {
        const active = href === "/" ? pathname === "/" :
          pathname === href || pathname.startsWith(href + "/");
        return (
          <Link key={href} href={href} className={active ? "app-tab is-active" : "app-tab"}
            aria-current={active ? "page" : undefined}>
            <Icon size={21} strokeWidth={active ? 2.5 : 1.9} aria-hidden="true"/>
            <span>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
