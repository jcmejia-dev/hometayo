import {redirect} from "next/navigation";
import type {Metadata} from "next";
import {currentUser} from "@/lib/session-user";

export const metadata:Metadata={title:"Messages"};
export const dynamic="force-dynamic";

export default async function RentalCenterPage(){
 const user=await currentUser();
 if(!user)redirect("/sign-in?next=%2Finbox");
 redirect("/inbox");
}
