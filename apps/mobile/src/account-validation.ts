export function accountValidation(mode:"sign-in"|"sign-up"|"verify",fields:{name:string;email:string;password:string;confirm:string;code:string}):string|null {
  if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fields.email.trim())||fields.email.trim().length>254)return "Enter a valid email address.";
  if(mode==="verify")return /^\d{6}$/.test(fields.code)?null:"Enter the six-digit code from your email.";
  if(mode==="sign-up"&&(fields.name.trim().length<2||fields.name.trim().length>80))return "Enter your full name (2–80 characters).";
  if(!fields.password.length)return "Enter your password.";
  if(fields.password.length>128)return "Use at most 128 characters for your password.";
  if(mode==="sign-up"&&fields.password.length<12)return "Use at least 12 characters for your password.";
  if(mode==="sign-up"&&fields.password!==fields.confirm)return "Passwords do not match.";
  return null;
}
