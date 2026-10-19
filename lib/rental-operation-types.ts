export type Conversation={id:string;listingId:string;title:string;slug:string;isOwner:boolean;otherName:string;otherPhoto?:string|null;otherUserId?:string;lastMessage?:string|null;lastMessageAt?:string|null;lastMessageMine?:boolean;lastMediaType?:"text"|"gif"|null};
export type RentalMessage={id:string;body:string;mine:boolean;createdAt:string;senderId?:string;replyToId?:string|null;replyBody?:string|null;mediaType?:"text"|"gif";deliveredAt?:string|null;seenAt?:string|null;reactions?:Array<{emoji:string;count:number;mine:boolean}>};
export type Tenancy={id:string;status:"invited"|"active"|"ended"|"declined";monthlyRentCentavos:number;startsOn:string;endedOn:string|null;label:string};
export type Charge={id:string;tenancyId:string;description:string;dueOn:string;amountCentavos:number;paidCentavos:number|string;voidedAt:string|null;voidReason:string|null};
export type Payment={id:string;chargeId:string;amountCentavos:number;paidOn:string;note:string;voidedAt:string|null;voidReason:string|null};
export type Notice={id:string;conversationId:string|null;listingId?:string|null;kind:string;body:string;readAt:string|null;createdAt:string};
export type OperationsState={conversations:Conversation[];messages:RentalMessage[];tenancies:Tenancy[];charges:Charge[];payments:Payment[];notifications:Notice[];typing:boolean;
 summary:{properties:number;available:number;occupied:number;expectedCentavos:number|string;collectedCentavos:number|string;outstandingCentavos:number|string};month:string};
