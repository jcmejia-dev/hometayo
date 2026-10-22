import React from "react";
import {RentalCenter as RentalCenterCore} from "./rental-center";

export function RentalCenter({owner,initialConversation="",onMessages}:{owner:boolean;initialConversation?:string;onMessages?:(conversationId:string)=>void}){
 return <RentalCenterCore owner={owner} initialConversation={initialConversation} onMessages={onMessages}/>;
}
