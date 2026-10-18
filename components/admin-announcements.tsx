import "server-only";
import {Megaphone,Archive} from "lucide-react";
import {sql} from "drizzle-orm";
import {getDatabase} from "@/lib/db";
import {archiveAnnouncement,publishAnnouncement} from "@/app/administratorsite/announcement-actions";

type AnnouncementRow={id:string;title:string;body:string;audience:string;tone:string;created_at:Date};

export async function AdminAnnouncements(){
 const db=getDatabase();if(!db)return null;
 let rows:AnnouncementRow[]=[];let ready=true;
 try{const result=await db.execute(sql`SELECT id,title,body,audience,tone,created_at FROM platform_announcements WHERE active=true ORDER BY created_at DESC LIMIT 20`);rows=result.rows as unknown as AnnouncementRow[];}catch{ready=false;}
 return <section className="info-card admin-announcements">
  <div className="admin-data-heading"><Megaphone size={20}/><h2>Platform announcements</h2></div>
  <p>Publish product updates, maintenance notices, or important platform messages to HomeTayo members.</p>
  {!ready?<p className="status-notice">Announcements are awaiting database migration 009.</p>:<>
   <form action={publishAnnouncement} className="review-actions admin-announcement-form">
    <label>Title<input name="title" required minLength={2} maxLength={120} placeholder="HomeTayo update"/></label>
    <label>Message<textarea name="body" required minLength={2} maxLength={1000} rows={3} placeholder="Tell members what changed or what they need to know."/></label>
    <div className="workspace-inline"><label>Audience<select name="audience" defaultValue="all"><option value="all">Everyone</option><option value="renter">Renters only</option><option value="landlord">Owners only</option></select></label><label>Type<select name="tone" defaultValue="update"><option value="update">Product update</option><option value="info">Information</option><option value="maintenance">Maintenance</option></select></label></div>
    <button className="button button-primary"><Megaphone size={16}/> Publish announcement</button>
   </form>
   <div className="owner-list">{rows.map(item=><article className="owner-listing" key={item.id}><div><span className="owner-status">{item.tone} · {item.audience}</span><h3>{item.title}</h3><p>{item.body}</p><small>{new Intl.DateTimeFormat("en-PH",{dateStyle:"medium",timeStyle:"short",timeZone:"Asia/Manila"}).format(new Date(item.created_at))}</small></div><form action={archiveAnnouncement}><input type="hidden" name="id" value={item.id}/><button className="button button-outline"><Archive size={15}/> Archive</button></form></article>)}</div>
  </>}
 </section>;
}
