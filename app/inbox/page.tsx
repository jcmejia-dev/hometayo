import { redirect } from "next/navigation";
import { currentUser } from "@/lib/session-user";
import { RentalWorkspace } from "@/components/rental-workspace";
import { InboxEnterToSend } from "@/components/inbox-enter-to-send";
import { InboxLiveEnhancements } from "@/components/inbox-live-enhancements";
import { uuidInput } from "@/lib/rental-unit-input";
import styles from "./inbox.module.css";
import wideStyles from "./inbox-wide.module.css";
import liveStyles from "./live.module.css";
import layoutFix from "./workspace-layout-fix.module.css";

export const dynamic="force-dynamic";

export default async function Inbox({searchParams}:{searchParams:Promise<{conversationId?:string}>}){
 const user=await currentUser();if(!user)redirect("/sign-in");const p=await searchParams;const owner=user.role==="landlord";
 return <section className={`container interior-page ${styles.inboxPage} ${wideStyles.wideInbox} ${layoutFix.layoutFix} ${liveStyles.live}`}>
  <InboxEnterToSend/>
  <InboxLiveEnhancements owner={owner}/>
  <div className="interior-heading"><p className="section-kicker">YOUR HOMETAYO WORKSPACE</p><h1>{owner?"Manage your rentals.":"Messages & your tenancy."}</h1><p>Conversations, tenancy details, and payment records in one place.</p></div>
  <RentalWorkspace owner={owner} initialConversation={uuidInput.safeParse(p.conversationId).success?p.conversationId:undefined}/>
 </section>;
}
