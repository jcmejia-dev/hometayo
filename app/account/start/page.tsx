import {redirect} from "next/navigation";
import {eq} from "drizzle-orm";
import {Building2,House,UserRound} from "lucide-react";
import {ProfilePictureEditor} from "@/components/profile-picture-editor";
import {users} from "@/db/schema";
import {getDatabase} from "@/lib/db";
import {currentUser} from "@/lib/session-user";
import {loadAccountAvatar} from "@/lib/avatar-profile";
import {chooseAccountExperience} from "./actions";

export const dynamic="force-dynamic";

export default async function AccountStart({searchParams}:{searchParams:Promise<{audience?:string;setup?:string}>}){
 const account=await currentUser();
 if(!account)redirect("/sign-in");
 const db=getDatabase();
 if(!db)throw new Error("Account settings are temporarily unavailable.");
 const [profile]=await db.select({preferredName:users.preferredName}).from(users).where(eq(users.id,account.id)).limit(1);
 const params=await searchParams;
 if(profile?.preferredName&&params.setup!=="1")redirect(account.role==="landlord"?"/owner":"/");
 const avatar=await loadAccountAvatar(account.id);
 const ownerSelected=params.audience==="owner"||(params.audience!=="renter"&&account.role==="landlord");
 return <section className="container interior-page narrow-page account-choice-page">
  <p className="section-kicker">WELCOME TO HOMETAYO 👋</p>
  <h1>Let’s set up your profile.</h1>
  <p>Add a name and profile picture now so owners and renters know who they’re talking to. You can change everything later.</p>
  <form action={chooseAccountExperience} className="info-card profile-form">
   <div className="profile-section-title"><UserRound size={21}/><h2>Your profile picture</h2></div>
   <ProfilePictureEditor initialAvatar={avatar} defaultCustomize/>
   <label>Display name <input name="preferredName" required minLength={2} maxLength={80} defaultValue={profile?.preferredName??account.displayName??""} placeholder="What should we call you?"/></label>
   <fieldset className="account-options">
    <legend>How will you use HomeTayo?</legend>
    <label className="account-option"><input type="radio" name="audience" value="renter" required defaultChecked={!ownerSelected}/><House size={30} aria-hidden="true"/><strong>I’m a renter</strong><span>Explore homes, rooms and bedspaces, chat with owners, reserve a unit, and manage rent.</span></label>
    <label className="account-option"><input type="radio" name="audience" value="owner" required defaultChecked={ownerSelected}/><Building2 size={30} aria-hidden="true"/><strong>I’m a property owner</strong><span>List properties, chat with renters, manage reservations, payments, and occupancy.</span></label>
   </fieldset>
   <button className="button button-primary" type="submit">Save profile & continue</button>
  </form>
 </section>;
}
