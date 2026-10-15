import {createHash,timingSafeEqual} from "node:crypto";
export function ownerAllowed(account:{email:string}|null,expectedDigest:string):boolean{
 if(!account||!/^([a-f0-9]{64})$/.test(expectedDigest))return false;
 const actual=createHash("sha256").update(account.email.trim().toLowerCase()).digest();
 return timingSafeEqual(actual,Buffer.from(expectedDigest,"hex"));
}
export function publicAccountRole(role:string):"renter"|"landlord"{return role==="landlord"?"landlord":"renter";}
