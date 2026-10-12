import Link from "next/link";
import { ArrowRight, BookOpenCheck, Compass, HousePlus } from "lucide-react";

type GuideNudgeProps = { audience: "renter" | "owner"; compact?: boolean };
export function GuideNudge({ audience, compact = false }: GuideNudgeProps) {
  const renter = audience === "renter";
  return (
    <aside className={compact ? "guide-nudge guide-nudge-compact" : "guide-nudge"} aria-label={renter ? "Renter help" : "Owner help"}>
      <span className="guide-nudge-icon" aria-hidden="true">{renter ? <Compass size={23}/> : <HousePlus size={23}/>}</span>
      <div className="guide-nudge-copy">
        <span className="guide-nudge-kicker"><BookOpenCheck size={14}/> NEW TO HOMETAYO?</span>
        <strong>{renter ? "Here’s how to find a place." : "Here’s how to list your rental."}</strong>
        <p>{renter
          ? "Choose your location, set a budget, review approved listings, then contact the owner safely."
          : "Sign in, provide genuine property details, and wait for admin approval before your listing goes public."}</p>
      </div>
      <Link href={renter ? "/how-it-works#renters" : "/how-it-works#owners"} className="guide-nudge-link">
        View guide <ArrowRight size={16} aria-hidden="true"/>
      </Link>
    </aside>
  );
}
