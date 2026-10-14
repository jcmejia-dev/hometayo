import "server-only";
import nodemailer from "nodemailer";
import {emailDeliveryConfig} from "./email-delivery-config";
export async function deliverAccountEmail(message:{to:string;subject:string;html:string;text:string}){
  const config=emailDeliveryConfig(process.env);
  if(!config)throw Error("Email delivery is not configured");
  try{
    if(config.provider==="gmail"){
      const transport=nodemailer.createTransport({host:"smtp.gmail.com",port:465,secure:true,auth:{user:config.user,pass:config.password},connectionTimeout:10000,greetingTimeout:10000,socketTimeout:15000,disableFileAccess:true,disableUrlAccess:true});
      const result=await transport.sendMail({...message,from:config.from});
      if(!result.accepted?.length)throw Error("Recipient not accepted");
    }else{
      const response=await fetch("https://api.resend.com/emails",{method:"POST",cache:"no-store",signal:AbortSignal.timeout(15000),headers:{Authorization:"Bearer "+config.apiKey,"Content-Type":"application/json"},body:JSON.stringify({...message,from:config.from,to:[message.to]})});
      if(!response.ok)throw Error("Email rejected");
    }
  }catch{throw Error("Email could not be delivered. Please try again later.");}
}
