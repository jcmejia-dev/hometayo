"use server";

import {and,eq,inArray} from "drizzle-orm";
import {revalidatePath} from "next/cache";
import {redirect} from "next/navigation";
import {users} from "@/db/schema";
import {getDatabase} from "@/lib/db";
import {requireAccount} from "@/lib/session-user";
import {saveAccountAvatar,selectAvatarAsProfilePicture} from "@/lib/avatar-profile";

function field(form:FormData,key:string):string{const value=form.get(key);return typeof value==="string"?value:"";}

export async function chooseAccountExperience(form:FormData){
 const account=await requireAccount();
 const audience=field(form,"audience");
 if(audience!=="renter"&&audience!=="owner")throw new Error("Choose renter or property owner.");
 const preferredName=field(form,"preferredName").trim();
 if(preferredName.length<2||preferredName.length>80)throw new Error("Add a display name between 2 and 80 characters.");
 const db=getDatabase();
 if(!db)throw new Error("Account settings are temporarily unavailable.");
 await db.update(users).set({role:audience==="owner"?"landlord":"renter",preferredName,updatedAt:new Date()}).where(and(eq(users.id,account.id),inArray(users.role,["renter","landlord"])));
 const rawAvatar=field(form,"avatarConfig");
 if(rawAvatar)await saveAccountAvatar(account.id,rawAvatar);
 await selectAvatarAsProfilePicture(account.id,field(form,"profileImageMode")==="avatar");
 revalidatePath("/profile");
 revalidatePath("/owner");
 revalidatePath("/inbox");
 revalidatePath("/");
 redirect(audience==="owner"?"/owner":"/");
}
