"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Compass, House, LayoutDashboard, UserRound, MessageCircle, KeyRound } from "lucide-react";

function roleTabs(role:string){
  if(role==="landlord")return [
    {href:"/",label:"Home",icon:House},
    {href:"/rental-center",label:"Rental",icon:KeyRound},
    {href:"/inbox",label:"Messages",icon:MessageCircle},
    {href:"/owner",label:"Listings",icon:LayoutDashboard},
    {href:"/profile",label:"Profile",icon:UserRound},
  ];
  return [
    { href: "/", label: "Home", icon: House },
    { href: "/rentals", label: "Explore", icon: Compass },
    { href: "/rental-center", label: "My rental", icon: KeyRound },
    { href: "/inbox", label: "Messages", icon: MessageCircle },
    { href: "/profile", label: "Profile", icon: UserRound },
  ];
}

/** App-style navigation is reserved for authenticated renters and owners.
 *  Guests get a normal marketing website header/footer instead.
 */
export function MobileBottomNav({role=null}:{role?:string|null}) {
  const pathname = usePathname();
  if (!role || pathname === "/administratorsite" || pathname.startsWith("/administratorsite/") || ["/sign-in", "/sign-up", "/account/start", "/download"].includes(pathname)) return null;
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
