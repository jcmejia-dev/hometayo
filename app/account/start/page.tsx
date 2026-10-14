import { redirect } from "next/navigation";
import { Building2, House } from "lucide-react";
import { currentUser } from "@/lib/session-user";
import { chooseAccountExperience } from "./actions";

export const dynamic = "force-dynamic";

export default async function AccountStart({searchParams}: {searchParams: Promise<{audience?: string}>}) {
  const account = await currentUser();
  if (!account) redirect("/sign-in");
  const {audience} = await searchParams;
  const ownerSelected = audience === "owner" || (audience !== "renter" && account.role === "landlord");
  return <section className="container interior-page narrow-page account-choice-page">
    <p className="section-kicker">YOUR HOMETAYO EXPERIENCE</p>
    <h1>What brings you here?</h1>
    <p>Find your next home or share a place to rent. You can change this choice from your profile.</p>
    <form action={chooseAccountExperience}>
      <fieldset className="account-options">
        <legend>Choose how you’ll use HomeTayo</legend>
        <label className="account-option"><input type="radio" name="audience" value="renter" required defaultChecked={!ownerSelected}/><House size={30} aria-hidden="true"/><strong>I’m a renter</strong><span>Explore homes, rooms and bedspaces that fit your needs.</span></label>
        <label className="account-option"><input type="radio" name="audience" value="owner" required defaultChecked={ownerSelected}/><Building2 size={30} aria-hidden="true"/><strong>I’m a property owner</strong><span>List a rental and manage its review and availability.</span></label>
      </fieldset>
      <button className="button button-primary" type="submit">Continue to HomeTayo</button>
    </form>
  </section>;
}
