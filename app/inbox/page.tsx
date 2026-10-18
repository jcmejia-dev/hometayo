import { redirect } from "next/navigation";
import { currentUser } from "@/lib/session-user";
import { RentalWorkspace } from "@/components/rental-workspace";
import { InboxEnterToSend } from "@/components/inbox-enter-to-send";
import { uuidInput } from "@/lib/rental-unit-input";
import styles from "./inbox.module.css";

export const dynamic="force-dynamic";

export default async function Inbox({searchParams}:{searchParams:Promise<{conversationId?:string}>}){
 const user=await currentUser();if(!user)redirect("/sign-in");const p=await searchParams;
 return <section className={`container interior-page ${styles.inboxPage}`}>
  <InboxEnterToSend/>
  <div className="interior-heading"><p className="section-kicker">YOUR HOMETAYO WORKSPACE</p><h1>{user.role==="landlord"?"Manage your rentals.":"Messages & your tenancy."}</h1><p>Conversations, tenancy details, and payment records in one place.</p></div>
  <RentalWorkspace owner={user.role==="landlord"} initialConversation={uuidInput.safeParse(p.conversationId).success?p.conversationId:undefined}/>
 </section>;
}
