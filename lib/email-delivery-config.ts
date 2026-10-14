export type EmailDeliveryConfig={provider:"gmail";user:string;password:string;from:string}|{provider:"resend";apiKey:string;from:string};
export function emailDeliveryConfig(env:Record<string,string|undefined>):EmailDeliveryConfig|null{
  const provider=env.AUTH_EMAIL_PROVIDER||"resend";
  if(provider==="gmail"){
    const user=env.GMAIL_USER?.trim().toLowerCase();
    const password=env.GMAIL_APP_PASSWORD?.replace(/\s/g,"");
    if(!user||! /^[a-z0-9.!#$%&'*+/=?^_`{|}~-]+@(gmail|googlemail)\.com$/.test(user)||!password||!/^[a-zA-Z0-9]{16}$/.test(password))return null;
    return {provider,user,password,from:"HomeTayo <"+user+">"};
  }
  if(provider==="resend"&&env.RESEND_API_KEY&&env.AUTH_EMAIL_FROM)return {provider,apiKey:env.RESEND_API_KEY,from:env.AUTH_EMAIL_FROM};
  return null;
}
