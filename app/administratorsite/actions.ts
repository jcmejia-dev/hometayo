"use server";
import {AuthError} from "next-auth";
import {signIn} from "@/auth";
import {canAdminister} from "@/lib/admin-owner";
import {signInSchema} from "@/lib/auth-validation";
import type {AuthFormState} from "@/app/auth/actions";
export async function loginAdministrator(_:AuthFormState,form:FormData):Promise<AuthFormState>{
 const parsed=signInSchema.safeParse({email:form.get("email"),password:form.get("password")});
 if(!parsed.success||!canAdminister({email:parsed.data.email}))return {message:"Unable to sign in with these credentials."};
 try{await signIn("credentials",{email:parsed.data.email,password:parsed.data.password,redirectTo:"/administratorsite"});return {message:""};}catch(error){if(error instanceof AuthError)return {message:"Unable to sign in with these credentials."};throw error;}
}
