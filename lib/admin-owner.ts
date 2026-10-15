import "server-only";
import {ownerAllowed} from "./admin-policy";
// Pinned to the owner-confirmed identity. Never grant administration from a form or database role.
const ownerDigest="b1fc9b499230da6b2b034f7175b805e8bd7a8ffca45fb72eda97f8464112f711";
export function canAdminister(account:{email:string}|null){return ownerAllowed(account,ownerDigest);}
