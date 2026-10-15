import {z} from "zod";
import {signInSchema,signUpSchema} from "./auth-validation.ts";
export const nativeAuthInput=z.discriminatedUnion("action",[
  signInSchema.extend({action:z.literal("login")}),
  signUpSchema.safeExtend({action:z.literal("signup"),audience:z.enum(["renter","owner"]).default("renter")}),
  z.object({action:z.literal("verify"),email:z.email().max(254),code:z.string().regex(/^\d{6}$/)}),
  z.object({action:z.literal("google"),idToken:z.string().min(100).max(10000),audience:z.enum(["renter","owner"]).optional()}),
  z.object({action:z.literal("audience"),audience:z.enum(["renter","owner"])}),
  z.object({action:z.literal("logout")}),
]);
export const SESSION_LOOKUP="SELECT u.id,u.email,u.display_name AS \"displayName\",u.role FROM native_sessions s JOIN users u ON u.id=s.user_id WHERE s.token_hash=$1 AND s.expires_at>now() LIMIT 1";
export const ROLE_SELECTION="UPDATE users SET role=$1,updated_at=now() WHERE id=$2 AND role IN ('renter','landlord')";
