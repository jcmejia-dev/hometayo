"use client";
import {useState} from "react";
import {Flag} from "lucide-react";

type Props={label?:string;category?:"scam"|"harassment"|"inappropriate_message"|"fake_listing"|"other";listingId?:string;messageId?:string;conversationId?:string;compact?:boolean};
export function ReportSafety({label="Report",category="other",listingId,messageId,conversationId,compact=false}:Props){
 const [busy,setBusy]=useState(false),[message,setMessage]=useState("");
 async function report(){
  if(busy)return;
  const details=window.prompt("Tell the HomeTayo admin what happened. Do not include passwords, OTPs, or banking PINs.","");
  if(details===null)return;
  if(!window.confirm("Send this report to the HomeTayo administrator for review?"))return;
  setBusy(true);setMessage("");
  try{const r=await fetch("/api/safety-reports",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({category,details,listingId,messageId,conversationId})}),d=await r.json();if(!r.ok)throw Error(d.message||"Could not report.");setMessage(d.message);}
  catch(e){setMessage(e instanceof Error?e.message:"Could not report.");}finally{setBusy(false);}
 }
 return <span className={compact?"report-control compact-report":"report-control"}><button type="button" className="button button-outline" onClick={()=>void report()} disabled={busy}><Flag size={15}/>{busy?"Sending…":label}</button>{message&&<small role="status">{message}</small>}</span>;
}
