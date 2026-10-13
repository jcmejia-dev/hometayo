import { z } from "zod";
export const emailSchema = z.email().max(254).transform(v => v.trim().toLowerCase());
export const passwordSchema = z.string().min(12, "Use at least 12 characters.").max(128, "Use at most 128 characters.");
export const signInSchema = z.object({ email: emailSchema, password: z.string().min(1).max(128) });
export const signUpSchema = z.object({
  name: z.string().trim().min(2).max(80), email: emailSchema,
  password: passwordSchema, confirmPassword: z.string(),
}).refine(v => v.password === v.confirmPassword, { path:["confirmPassword"],message:"Passwords do not match." });
export const resetSchema = z.object({
  token: z.string().regex(/^[A-Za-z0-9_-]{40,60}$/),
  password: passwordSchema, confirmPassword: z.string(),
}).refine(v => v.password === v.confirmPassword, {path:["confirmPassword"],message:"Passwords do not match."});
