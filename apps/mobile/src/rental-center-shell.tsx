import React from "react";
import {CanonicalRentalCenter} from "./canonical-rental-center";

export function RentalCenter({owner,initialConversation="",onMessages}:{owner:boolean;initialConversation?:string;onMessages?:(conversationId:string)=>void}){
 return <CanonicalRentalCenter owner={owner} initialConversation={initialConversation} onMessages={onMessages}/>;
}
