import "server-only";
import {Info,Megaphone,Wrench} from "lucide-react";
import {sql} from "drizzle-orm";
import {getDatabase} from "@/lib/db";

type Row={id:string;title:string;body:string;tone:string;created_at:Date};

export async function PlatformAnnouncement({role}:{role:string|null}){
 const db=getDatabase();if(!db)return null;
 let row:Row|undefined;
 try{const audience=role==="landlord"?"landlord":role==="renter"?"renter":"all";const result=await db.execute(sql`SELECT id,title,body,tone,created_at FROM platform_announcements WHERE active=true AND (audience='all' OR audience=${audience}) ORDER BY created_at DESC LIMIT 1`);row=result.rows[0] as unknown as Row|undefined;}catch{return null;}
 if(!row)return null;
 const Icon=row.tone==="maintenance"?Wrench:row.tone==="info"?Info:Megaphone;
 const palette=row.tone==="maintenance"?{background:"#fff7e8",border:"#efc36a",color:"#6d4b00"}:row.tone==="info"?{background:"#eef6fb",border:"#a7c5dd",color:"#245f89"}:{background:"#edf7f0",border:"#9bc5aa",color:"#17623f"};
 return <aside aria-label="HomeTayo announcement" style={{...palette,borderBottom:`1px solid ${palette.border}`}}><div style={{maxWidth:1200,margin:"0 auto",padding:"10px 22px",display:"flex",gap:10,alignItems:"flex-start"}}><Icon size={18} style={{marginTop:2,flex:"0 0 auto"}}/><div><strong style={{display:"block",fontSize:13}}>{row.title}</strong><span style={{fontSize:12,lineHeight:1.5}}>{row.body}</span></div></div></aside>;
}
