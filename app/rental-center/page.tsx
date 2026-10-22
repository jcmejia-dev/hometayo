import {redirect} from "next/navigation";
import type {Metadata} from "next";
import {currentUser} from "@/lib/session-user";
import {RentalCenter} from "@/components/rental-center";
import {RentalNegotiation} from "@/components/rental-negotiation";

export const metadata:Metadata={title:"Rental Center"};
export const dynamic="force-dynamic";

export default async function RentalCenterPage(){
 const user=await currentUser();
 if(!user)redirect("/sign-in?next=%2Frental-center");
 const owner=user.role==="landlord";
 return <><RentalNegotiation owner={owner}/><RentalCenter owner={owner}/></>;
}
