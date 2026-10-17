export type Conversation={id:string;listingId:string;title:string;slug:string;isOwner:boolean;otherName:string};
export type RentalMessage={id:string;body:string;mine:boolean;createdAt:string};
export type Tenancy={id:string;status:"invited"|"active"|"ended"|"declined";monthlyRentCentavos:number;startsOn:string;endedOn:string|null;label:string};
export type Charge={id:string;tenancyId:string;description:string;dueOn:string;amountCentavos:number;paidCentavos:number|string;voidedAt:string|null;voidReason:string|null};
export type Payment={id:string;chargeId:string;amountCentavos:number;paidOn:string;note:string;voidedAt:string|null;voidReason:string|null};
export type Notice={id:string;conversationId:string;kind:string;body:string;readAt:string|null;createdAt:string};
export type OperationsState={conversations:Conversation[];messages:RentalMessage[];tenancies:Tenancy[];charges:Charge[];payments:Payment[];notifications:Notice[];
 summary:{properties:number;available:number;occupied:number;expectedCentavos:number|string;collectedCentavos:number|string;outstandingCentavos:number|string};month:string};
