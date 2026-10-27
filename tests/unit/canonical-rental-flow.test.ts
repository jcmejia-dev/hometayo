import {test} from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";

const source=(path:string)=>readFileSync(new URL(`../../${path}`,import.meta.url),"utf8");

test("HomeTayo exposes one canonical commitment path through chat offers",()=>{
 const operations=source("lib/rental-operations.ts");
 assert.match(operations,/LEGACY_COMMITMENT_ACTIONS/);
 for(const action of ["invite","accept","decline","requestRent","approveRentRequest","declineRentRequest"])assert.match(operations,new RegExp(`\\"${action}\\"`));
 assert.match(operations,/Offer & negotiate in Messages/);
 const inbox=source("components/inbox-live-enhancements.tsx");
 assert.match(inbox,/ChatRentalOffer/);assert.match(inbox,/ChatRentalTimeline/);assert.match(inbox,/ChatRentalLifecycle/);assert.match(inbox,/chat-rental-lifecycle-root/);
 const mobileShell=source("apps/mobile/src/rental-center-shell.tsx"),mobile=source("apps/mobile/src/canonical-rental-center.tsx");
 assert.match(mobileShell,/CanonicalRentalCenter/);assert.match(mobile,/Offer & negotiate/);assert.doesNotMatch(mobile,/action:\"requestRent\"|approveRentRequest|Send tenancy invitation/);
});

test("post-agreement tools in Messages cover the complete rental lifecycle",()=>{
 const lifecycle=source("components/chat-rental-lifecycle.tsx");
 for(const required of ["Agreement & reservation","submitReservationProof","confirmReservationPayment","activateTenancy","Payments & rent ledger","submitPaymentProof","confirmPaymentProof","Maintenance","maintenanceCreate","Documents","documentAdd","Reviews","requestMoveOut","markEnding"])assert.match(lifecycle,new RegExp(required.replace(/[&]/g,"\\&")));
 assert.doesNotMatch(lifecycle,/requestRent|approveRentRequest|Send tenancy invitation/);
 const timeline=source("components/chat-rental-timeline.tsx");assert.match(timeline,/Rental transaction timeline/);assert.match(timeline,/Offer accepted — terms locked/);
});

test("conversation rental notifications deep-link back into Messages",()=>{
 const server=source("lib/push-notifications.ts"),mobile=source("apps/mobile/src/push-notifications.ts");
 assert.match(server,/screen:inConversation\?\"messages\":\"rental\"/);assert.match(server,/offer:\"offer\"/);assert.match(mobile,/screen===\"messages\"&&id/);
 const messagesIndex=mobile.indexOf('screen==="messages"'),rentalTypeIndex=mobile.indexOf('type==="rental"');assert.ok(messagesIndex>=0&&rentalTypeIndex>messagesIndex,"explicit Messages deep-link must win over generic rental type");
});
