"use client";

import Link from "next/link";
import { useActionState } from "react";
import { ArrowRight, LockKeyhole, Mail, UserRound } from "lucide-react";
import {
  type AuthFormState, loginWithEmail, requestResetAction, resetPasswordAction,
  signUpWithEmail, verifyEmailAction,
} from "@/app/auth/actions";

const initial: AuthFormState = {message:""};

export function EmailLoginForm({enabled}:{enabled:boolean}) {
  const [state,action,pending]=useActionState(loginWithEmail,initial);
  return <form action={action} className="auth-input-form">
    <label htmlFor="login-email">Email address</label>
    <span className="auth-input-wrap"><Mail size={17}/><input id="login-email" name="email" type="email" autoComplete="email" required maxLength={254} placeholder="you@example.com" disabled={!enabled}/></span>
    <div className="auth-label-row"><label htmlFor="login-password">Password</label>{enabled && <Link href="/forgot-password">Forgot password?</Link>}</div>
    <span className="auth-input-wrap"><LockKeyhole size={17}/><input id="login-password" name="password" type="password" autoComplete="current-password" minLength={1} maxLength={128} required placeholder="Enter your password" disabled={!enabled}/></span>
    {state.message && <p className="auth-form-status" role="alert">{state.message}</p>}
    <button className="auth-submit" type="submit" disabled={!enabled || pending}>{pending ? "Signing in…" : "Sign in"}</button>
    {!enabled && <p className="auth-unavailable" role="status">Email sign-in isn\'t available yet. Use Google to continue.</p>}
  </form>;
}
export function EmailSignUpForm({enabled}:{enabled:boolean}) {
  const [state,action,pending]=useActionState(signUpWithEmail,initial);
  return <form action={action} className="auth-input-form">
    <label htmlFor="signup-name">Full name</label>
    <span className="auth-input-wrap"><UserRound size={17}/><input id="signup-name" name="name" autoComplete="name" required minLength={2} maxLength={80} placeholder="Your full name" disabled={!enabled}/></span>
    <label htmlFor="signup-email">Email address</label>
    <span className="auth-input-wrap"><Mail size={17}/><input id="signup-email" name="email" type="email" autoComplete="email" required maxLength={254} placeholder="you@example.com" disabled={!enabled}/></span>
    <label htmlFor="signup-password">Password</label>
    <span className="auth-input-wrap"><LockKeyhole size={17}/><input id="signup-password" name="password" type="password" autoComplete="new-password" required minLength={12} maxLength={128} placeholder="At least 12 characters" disabled={!enabled}/></span>
    <label htmlFor="signup-confirm">Confirm password</label>
    <span className="auth-input-wrap"><LockKeyhole size={17}/><input id="signup-confirm" name="confirmPassword" type="password" autoComplete="new-password" required minLength={12} maxLength={128} placeholder="Repeat your password" disabled={!enabled}/></span>
    {enabled && <p className="auth-field-help">We’ll send a verification link to your email.</p>}
    {state.message && <p className={state.success?"auth-form-success":"auth-form-status"} role="status">{state.message}</p>}
    <button className="auth-submit" type="submit" disabled={!enabled||pending}>{pending?"Creating account…":"Create account"}</button>
    {!enabled && <p className="auth-unavailable" role="status">Email registration isn\'t available yet. Use Google to create an account.</p>}
  </form>;
}
export function ForgotPasswordForm({enabled}:{enabled:boolean}){
  const [state,action,pending]=useActionState(requestResetAction,initial);
  return <form action={action} className="auth-input-form">
    <label htmlFor="recover-email">Your email address</label>
    <span className="auth-input-wrap"><Mail size={17}/><input id="recover-email" name="email" type="email" autoComplete="email" maxLength={254} required placeholder="you@example.com" disabled={!enabled}/></span>
    {state.message && <p className={state.success?"auth-form-success":"auth-form-status"} role="status">{state.message}</p>}
    <button className="auth-submit" type="submit" disabled={!enabled||pending}>Email reset link <ArrowRight size={17}/></button>
  </form>;
}
export function VerifyEmailForm({token}:{token:string}) {
  const [state,action,pending]=useActionState(verifyEmailAction,initial);
  return <form action={action} className="auth-input-form">
    <input type="hidden" name="token" value={token}/>
    {state.message && <p role="alert" className="auth-form-status">{state.message}</p>}
    <button className="auth-submit" type="submit" disabled={!token||pending}>Verify email <ArrowRight size={17}/></button>
  </form>;
}
export function ResetPasswordForm({token}:{token:string}){
  const [state,action,pending]=useActionState(resetPasswordAction,initial);
  if (state.success) return <div className="auth-form-success" role="status">{state.message} <Link href="/sign-in">Go to sign in →</Link></div>;
  return <form action={action} className="auth-input-form">
    <input type="hidden" name="token" value={token}/>
    <label htmlFor="reset-password">New password</label>
    <span className="auth-input-wrap"><LockKeyhole size={17}/><input id="reset-password" name="password" type="password" autoComplete="new-password" minLength={12} maxLength={128} required placeholder="At least 12 characters"/></span>
    <label htmlFor="reset-confirm">Confirm new password</label>
    <span className="auth-input-wrap"><LockKeyhole size={17}/><input id="reset-confirm" name="confirmPassword" type="password" autoComplete="new-password" minLength={12} maxLength={128} required placeholder="Repeat new password"/></span>
    {state.message && <p className="auth-form-status" role="alert">{state.message}</p>}
    <button className="auth-submit" type="submit" disabled={!token||pending}>Update password <ArrowRight size={17}/></button>
  </form>;
}
