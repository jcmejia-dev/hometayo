import "server-only";
import {neon} from "@neondatabase/serverless";
import type {RentalOperation} from "./rental-operation-input";
import type {AvailableUnit,Charge,LedgerSummary,MaintenanceRequest,RentalDocument,RentalRequest,RentalReview,Tenancy} from "./rental-operation-types";
import {dispatchPendingRentalPushes} from "./push-notifications";

const lifecycleActions=new Set([
 "requestRent","cancelRentRequest","approveRentRequest","declineRentRequest","markEnding",
 "maintenanceCreate","maintenanceStatus","documentAdd","documentDelete","review",
]);
export function isLifecycleOperation(v:RentalOperation){return lifecycleActions.has(v.action);}
function client(){if(process.env.ENABLE_RENTAL_MANAGEMENT!=="true"||!process.env.DATABASE_URL)throw Error("Rental management is awaiting setup.");return neon(process.env.DATABASE_URL);}

const REQUEST_RENT=`WITH req AS (
 INSERT INTO rental_requests(conversation_id,unit_id,renter_id,desired_move_in_on)
 SELECT c.id,u.id,$1,$4::date FROM rental_conversations c JOIN rental_units u ON u.listing_id=c.listing_id
 WHERE c.id=$2::uuid AND c.renter_id=$1 AND u.id=$3::uuid AND u.status<>'unavailable'
  AND NOT EXISTS(SELECT 1 FROM rental_requests x WHERE x.conversation_id=c.id AND x.status='pending')
  AND NOT EXISTS(SELECT 1 FROM rental_tenancies t WHERE t.conversation_id=c.id AND t.status IN ('invited','active','ending'))
 RETURNING *
), n AS (INSERT INTO rental_notifications(user_id,conversation_id,kind,body,event_key)
 SELECT c.owner_id,c.id,'rental_request','New request to rent '||u.label,'rental-request:'||req.id
 FROM req JOIN rental_conversations c ON c.id=req.conversation_id JOIN rental_units u ON u.id=req.unit_id)
 SELECT id FROM req`;
const CANCEL_REQUEST=`WITH req AS (
 UPDATE rental_requests r SET status='cancelled',decided_at=now() FROM rental_conversations c
 WHERE r.id=$2::uuid AND c.id=r.conversation_id AND r.renter_id=$1 AND r.status='pending' RETURNING r.*
), n AS (INSERT INTO rental_notifications(user_id,conversation_id,kind,body,event_key)
 SELECT c.owner_id,c.id,'rental_request','Renter cancelled the rental request','rental-request-cancel:'||req.id
 FROM req JOIN rental_conversations c ON c.id=req.conversation_id)
 SELECT id FROM req`;
const APPROVE_REQUEST=`WITH req AS MATERIALIZED (
 SELECT r.*,c.owner_id,c.renter_id,u.capacity FROM rental_requests r
 JOIN rental_conversations c ON c.id=r.conversation_id JOIN rental_units u ON u.id=r.unit_id
 WHERE r.id=$2::uuid AND r.status='pending' AND c.owner_id=$1 AND u.status<>'unavailable'
  AND $5::date<=$7::date AND ($6::text='' OR $6::date>=$5::date)
  AND NOT EXISTS(SELECT 1 FROM rental_tenancies x WHERE x.conversation_id=c.id AND x.status IN ('invited','active','ending'))
  AND (SELECT count(*) FROM rental_tenancies x WHERE x.unit_id=u.id AND x.status IN ('invited','active','ending'))<u.capacity
 FOR UPDATE OF r,u
), t AS (
 INSERT INTO rental_tenancies(conversation_id,unit_id,status,monthly_rent_centavos,security_deposit_centavos,starts_on,lease_ends_on,move_in_on,approved_at)
 SELECT conversation_id,unit_id,'active',$3,$4,$5::date,NULLIF($6::text,'')::date,$7::date,now() FROM req RETURNING *
), done AS (
 UPDATE rental_requests r SET status='approved',tenancy_id=t.id,owner_note=$8,decided_at=now() FROM t WHERE r.id=$2::uuid RETURNING r.*
), n AS (INSERT INTO rental_notifications(user_id,conversation_id,kind,body,event_key)
 SELECT c.renter_id,c.id,'tenancy','Your rental request was approved. Your tenancy is now active.','request-approved:'||t.id
 FROM t JOIN rental_conversations c ON c.id=t.conversation_id)
 SELECT id FROM t`;
const DECLINE_REQUEST=`WITH req AS (
 UPDATE rental_requests r SET status='declined',owner_note=$3,decided_at=now() FROM rental_conversations c
 WHERE r.id=$2::uuid AND c.id=r.conversation_id AND c.owner_id=$1 AND r.status='pending' RETURNING r.*
), n AS (INSERT INTO rental_notifications(user_id,conversation_id,kind,body,event_key)
 SELECT c.renter_id,c.id,'rental_request','Your rental request was declined.','request-declined:'||req.id
 FROM req JOIN rental_conversations c ON c.id=req.conversation_id)
 SELECT id FROM req`;
const MARK_ENDING=`WITH t AS (
 UPDATE rental_tenancies t SET status='ending',ending_on=$3::date,lease_ends_on=COALESCE(lease_ends_on,$3::date)
 FROM rental_conversations c WHERE t.id=$2::uuid AND c.id=t.conversation_id AND c.owner_id=$1 AND t.status='active'
  AND $3::date>=t.starts_on RETURNING t.*
), n AS (INSERT INTO rental_notifications(user_id,conversation_id,kind,body,event_key)
 SELECT c.renter_id,c.id,'tenancy','Your tenancy is scheduled to end on '||t.ending_on::text,'tenancy-ending:'||t.id
 FROM t JOIN rental_conversations c ON c.id=t.conversation_id ON CONFLICT(event_key) DO UPDATE SET body=excluded.body,read_at=NULL,created_at=now())
 SELECT id FROM t`;
const MAINTENANCE_CREATE=`WITH m AS (
 INSERT INTO maintenance_requests(tenancy_id,created_by,title,description,priority,photo_url)
 SELECT t.id,$1,$3,$4,$5,$6 FROM rental_tenancies t JOIN rental_conversations c ON c.id=t.conversation_id
 WHERE t.id=$2::uuid AND c.renter_id=$1 AND t.status IN ('active','ending') RETURNING *
), n AS (INSERT INTO rental_notifications(user_id,conversation_id,kind,body,event_key)
 SELECT c.owner_id,c.id,'maintenance','New maintenance request: '||m.title,'maintenance:'||m.id
 FROM m JOIN rental_tenancies t ON t.id=m.tenancy_id JOIN rental_conversations c ON c.id=t.conversation_id)
 SELECT id FROM m`;
const MAINTENANCE_STATUS=`WITH m AS (
 UPDATE maintenance_requests m SET status=$3,updated_at=now(),resolved_at=CASE WHEN $3='resolved' THEN now() ELSE NULL END
 FROM rental_tenancies t JOIN rental_conversations c ON c.id=t.conversation_id
 WHERE m.id=$2::uuid AND m.tenancy_id=t.id AND c.owner_id=$1 AND m.status<>'resolved' RETURNING m.*
), n AS (INSERT INTO rental_notifications(user_id,conversation_id,kind,body,event_key)
 SELECT c.renter_id,c.id,'maintenance','Maintenance request "'||m.title||'" is now '||replace(m.status,'_',' '),
  'maintenance-status:'||m.id||':'||m.status FROM m JOIN rental_tenancies t ON t.id=m.tenancy_id JOIN rental_conversations c ON c.id=t.conversation_id
 ON CONFLICT(event_key) DO NOTHING)
 SELECT id FROM m`;
const DOCUMENT_ADD=`WITH d AS (
 INSERT INTO rental_documents(tenancy_id,uploaded_by,kind,label,url)
 SELECT t.id,$1,$3,$4,$5 FROM rental_tenancies t JOIN rental_conversations c ON c.id=t.conversation_id
 WHERE t.id=$2::uuid AND $1 IN(c.owner_id,c.renter_id) AND t.status<>'declined' RETURNING *
), n AS (INSERT INTO rental_notifications(user_id,conversation_id,kind,body,event_key)
 SELECT CASE WHEN c.owner_id=$1 THEN c.renter_id ELSE c.owner_id END,c.id,'document','New rental document: '||d.label,'document:'||d.id
 FROM d JOIN rental_tenancies t ON t.id=d.tenancy_id JOIN rental_conversations c ON c.id=t.conversation_id)
 SELECT id FROM d`;
const DOCUMENT_DELETE=`DELETE FROM rental_documents d USING rental_tenancies t,rental_conversations c
 WHERE d.id=$2::uuid AND d.tenancy_id=t.id AND c.id=t.conversation_id AND (d.uploaded_by=$1 OR c.owner_id=$1) RETURNING d.id`;
const REVIEW=`WITH target AS (
 SELECT t.id AS tenancy_id,c.listing_id,c.owner_id,c.renter_id,
  CASE WHEN $3='property' THEN NULL WHEN c.owner_id=$1 THEN c.renter_id ELSE c.owner_id END AS target_user
 FROM rental_tenancies t JOIN rental_conversations c ON c.id=t.conversation_id
 WHERE t.id=$2::uuid AND t.status='ended' AND $1 IN(c.owner_id,c.renter_id)
  AND NOT($3='property' AND c.owner_id=$1)
), r AS (
 INSERT INTO rental_reviews(tenancy_id,author_id,target_type,target_user_id,listing_id,rating,body)
 SELECT tenancy_id,$1,$3,target_user,CASE WHEN $3='property' THEN listing_id ELSE NULL END,$4,$5 FROM target
 ON CONFLICT(tenancy_id,author_id,target_type) DO UPDATE SET rating=excluded.rating,body=excluded.body,created_at=now()
 RETURNING *
), n AS (INSERT INTO rental_notifications(user_id,conversation_id,kind,body,event_key)
 SELECT CASE WHEN c.owner_id=$1 THEN c.renter_id ELSE c.owner_id END,c.id,'review','A post-tenancy review was submitted','review:'||r.id
 FROM r JOIN rental_tenancies t ON t.id=r.tenancy_id JOIN rental_conversations c ON c.id=t.conversation_id
 ON CONFLICT(event_key) DO UPDATE SET body=excluded.body,read_at=NULL,created_at=now())
 SELECT id FROM r`;

export async function performLifecycleOperation(userId:string,v:RentalOperation){
 const sql=client();let query="",args:unknown[]=[];
 switch(v.action){
  case "requestRent":query=REQUEST_RENT;args=[userId,v.conversationId,v.unitId,v.desiredMoveInOn];break;
  case "cancelRentRequest":query=CANCEL_REQUEST;args=[userId,v.requestId];break;
  case "approveRentRequest":query=APPROVE_REQUEST;args=[userId,v.requestId,v.monthlyRent,v.securityDeposit,v.leaseStartsOn,v.leaseEndsOn||"",v.moveInOn,v.ownerNote];break;
  case "declineRentRequest":query=DECLINE_REQUEST;args=[userId,v.requestId,v.ownerNote];break;
  case "markEnding":query=MARK_ENDING;args=[userId,v.tenancyId,v.endingOn];break;
  case "maintenanceCreate":query=MAINTENANCE_CREATE;args=[userId,v.tenancyId,v.title,v.description,v.priority,v.photoUrl];break;
  case "maintenanceStatus":query=MAINTENANCE_STATUS;args=[userId,v.requestId,v.status];break;
  case "documentAdd":query=DOCUMENT_ADD;args=[userId,v.tenancyId,v.kind,v.label,v.url];break;
  case "documentDelete":query=DOCUMENT_DELETE;args=[userId,v.documentId];break;
  case "review":query=REVIEW;args=[userId,v.tenancyId,v.targetType,v.rating,v.body];break;
  default:throw Error("Unsupported rental lifecycle action.");
 }
 const rows=await sql.query(query,args) as Array<{id:string}>;
 if(!rows.length)throw Error("Action unavailable. Check the rental status, unit capacity, and your access.");
 await dispatchPendingRentalPushes();
 return {id:rows[0].id,message:"Saved."};
}

const SYNC_AUTOMATIC_CHARGES=`WITH live AS (
 SELECT t.id,t.starts_on,t.lease_ends_on,t.monthly_rent_centavos FROM rental_tenancies t WHERE t.status IN ('active','ending')
), periods AS (
 SELECT date_trunc('month',(now() AT TIME ZONE 'Asia/Manila')::date)::date AS month_start
 UNION ALL SELECT (date_trunc('month',(now() AT TIME ZONE 'Asia/Manila')::date)+interval '1 month')::date
), dues AS (
 SELECT l.*,(p.month_start + (LEAST(EXTRACT(day FROM l.starts_on)::int,EXTRACT(day FROM (p.month_start+interval '1 month - 1 day'))::int)-1)*interval '1 day')::date AS due_on
 FROM live l CROSS JOIN periods p
), added AS (
 INSERT INTO rent_charges(tenancy_id,due_on,description,amount_centavos,source)
 SELECT d.id,d.due_on,to_char(d.due_on,'FMMonth YYYY')||' rent',d.monthly_rent_centavos,'automatic' FROM dues d
 WHERE d.due_on>=d.starts_on AND (d.lease_ends_on IS NULL OR d.due_on<=d.lease_ends_on)
  AND NOT EXISTS(SELECT 1 FROM rent_charges r WHERE r.tenancy_id=d.id AND r.due_on=d.due_on AND r.voided_at IS NULL)
 ON CONFLICT DO NOTHING RETURNING id
) SELECT count(*)::int AS count FROM added`;
const SYNC_REMINDERS=`WITH balances AS (
 SELECT r.id,r.due_on,r.description,r.amount_centavos-COALESCE(sum(p.amount_centavos) FILTER(WHERE p.voided_at IS NULL),0) AS balance,
  c.id AS conversation_id,c.renter_id
 FROM rent_charges r JOIN rental_tenancies t ON t.id=r.tenancy_id JOIN rental_conversations c ON c.id=t.conversation_id
 LEFT JOIN rent_payments p ON p.charge_id=r.id WHERE r.voided_at IS NULL GROUP BY r.id,c.id,c.renter_id
), due_tomorrow AS (
 INSERT INTO rental_notifications(user_id,conversation_id,kind,body,event_key)
 SELECT renter_id,conversation_id,'reminder','Rent is due tomorrow: '||description,'rent-due-tomorrow:'||id FROM balances
 WHERE due_on=(now() AT TIME ZONE 'Asia/Manila')::date+1 AND balance>0 ON CONFLICT(event_key) DO NOTHING RETURNING id
), overdue AS (
 INSERT INTO rental_notifications(user_id,conversation_id,kind,body,event_key)
 SELECT renter_id,conversation_id,'reminder','Rent is overdue: '||description,'rent-overdue:'||id FROM balances
 WHERE due_on<(now() AT TIME ZONE 'Asia/Manila')::date AND balance>0 ON CONFLICT(event_key) DO NOTHING RETURNING id
) SELECT (SELECT count(*) FROM due_tomorrow)+(SELECT count(*) FROM overdue) AS count`;

export async function syncRentalLifecycle(){
 const sql=client();
 try{await sql.query(SYNC_AUTOMATIC_CHARGES);await sql.query(SYNC_REMINDERS);await dispatchPendingRentalPushes();}catch{/* Migration 011 may still be rolling out. */}
}

export async function lifecycleState(userId:string,conversationId:string){
 const sql=client();await syncRentalLifecycle();
 const [tenancies,requests,availableUnits,charges,maintenance,documents,reviews]=await Promise.all([
  sql.query(`SELECT t.id,t.unit_id AS "unitId",t.status,
    CASE t.status WHEN 'invited' THEN 'Pending' WHEN 'active' THEN 'Active' WHEN 'ending' THEN 'Ending' ELSE 'Ended' END AS "occupancyStatus",
    t.monthly_rent_centavos AS "monthlyRentCentavos",t.security_deposit_centavos AS "securityDepositCentavos",
    t.starts_on::text AS "startsOn",t.lease_ends_on::text AS "leaseEndsOn",t.move_in_on::text AS "moveInOn",t.ending_on::text AS "endingOn",t.ended_on::text AS "endedOn",u.label
   FROM rental_tenancies t JOIN rental_conversations c ON c.id=t.conversation_id JOIN rental_units u ON u.id=t.unit_id
   WHERE c.id=$2::uuid AND $1 IN(c.owner_id,c.renter_id) ORDER BY t.created_at DESC`,[userId,conversationId]),
  sql.query(`SELECT r.id,r.conversation_id AS "conversationId",r.unit_id AS "unitId",u.label AS "unitLabel",r.desired_move_in_on::text AS "desiredMoveInOn",
    r.status,r.tenancy_id AS "tenancyId",r.owner_note AS "ownerNote",r.created_at AS "createdAt",r.decided_at AS "decidedAt",r.renter_id=$1 AS mine
   FROM rental_requests r JOIN rental_conversations c ON c.id=r.conversation_id JOIN rental_units u ON u.id=r.unit_id
   WHERE c.id=$2::uuid AND $1 IN(c.owner_id,c.renter_id) ORDER BY r.created_at DESC`,[userId,conversationId]),
  sql.query(`SELECT u.id,u.label,u.status,u.monthly_rent_centavos AS "monthlyRentCentavos",u.capacity,
    (SELECT count(*)::int FROM rental_tenancies t WHERE t.unit_id=u.id AND t.status IN ('invited','active','ending')) AS "liveTenants",
    GREATEST(0,u.capacity-(SELECT count(*)::int FROM rental_tenancies t WHERE t.unit_id=u.id AND t.status IN ('invited','active','ending'))) AS "availableSpots"
   FROM rental_conversations c JOIN rental_units u ON u.listing_id=c.listing_id
   WHERE c.id=$2::uuid AND $1 IN(c.owner_id,c.renter_id) AND u.status<>'unavailable' ORDER BY u.label`,[userId,conversationId]),
  sql.query(`SELECT r.id,r.tenancy_id AS "tenancyId",r.description,r.due_on::text AS "dueOn",r.amount_centavos AS "amountCentavos",
    COALESCE(sum(p.amount_centavos) FILTER(WHERE p.voided_at IS NULL),0)::bigint AS "paidCentavos",
    GREATEST(0,r.amount_centavos-COALESCE(sum(p.amount_centavos) FILTER(WHERE p.voided_at IS NULL),0))::bigint AS "balanceCentavos",
    max(p.paid_on)::text AS "lastPaidOn",r.source,r.voided_at AS "voidedAt",r.void_reason AS "voidReason",
    CASE WHEN r.voided_at IS NOT NULL THEN 'voided'
      WHEN COALESCE(sum(p.amount_centavos) FILTER(WHERE p.voided_at IS NULL),0)>=r.amount_centavos THEN 'paid'
      WHEN COALESCE(sum(p.amount_centavos) FILTER(WHERE p.voided_at IS NULL),0)>0 THEN 'partial'
      WHEN r.due_on<(now() AT TIME ZONE 'Asia/Manila')::date THEN 'overdue'
      WHEN r.due_on<=(now() AT TIME ZONE 'Asia/Manila')::date THEN 'due' ELSE 'upcoming' END AS status
   FROM rent_charges r JOIN rental_tenancies t ON t.id=r.tenancy_id JOIN rental_conversations c ON c.id=t.conversation_id
   LEFT JOIN rent_payments p ON p.charge_id=r.id WHERE c.id=$2::uuid AND $1 IN(c.owner_id,c.renter_id)
   GROUP BY r.id ORDER BY r.due_on DESC`,[userId,conversationId]),
  sql.query(`SELECT m.id,m.tenancy_id AS "tenancyId",m.title,m.description,m.priority,m.photo_url AS "photoUrl",m.status,m.created_by AS "createdBy",
    m.created_by=$1 AS mine,m.created_at AS "createdAt",m.updated_at AS "updatedAt",m.resolved_at AS "resolvedAt"
   FROM maintenance_requests m JOIN rental_tenancies t ON t.id=m.tenancy_id JOIN rental_conversations c ON c.id=t.conversation_id
   WHERE c.id=$2::uuid AND $1 IN(c.owner_id,c.renter_id) ORDER BY CASE m.status WHEN 'reported' THEN 0 WHEN 'in_progress' THEN 1 ELSE 2 END,m.created_at DESC`,[userId,conversationId]),
  sql.query(`SELECT d.id,d.tenancy_id AS "tenancyId",d.kind,d.label,d.url,d.uploaded_by AS "uploadedBy",d.uploaded_by=$1 AS mine,d.created_at AS "createdAt"
   FROM rental_documents d JOIN rental_tenancies t ON t.id=d.tenancy_id JOIN rental_conversations c ON c.id=t.conversation_id
   WHERE c.id=$2::uuid AND $1 IN(c.owner_id,c.renter_id) ORDER BY d.created_at DESC`,[userId,conversationId]),
  sql.query(`SELECT r.id,r.tenancy_id AS "tenancyId",r.author_id AS "authorId",r.target_type AS "targetType",r.target_user_id AS "targetUserId",r.listing_id AS "listingId",
    r.rating,r.body,r.author_id=$1 AS mine,COALESCE(u.preferred_name,u.display_name,'HomeTayo user') AS "authorName",r.created_at AS "createdAt"
   FROM rental_reviews r JOIN rental_tenancies t ON t.id=r.tenancy_id JOIN rental_conversations c ON c.id=t.conversation_id JOIN users u ON u.id=r.author_id
   WHERE c.id=$2::uuid AND $1 IN(c.owner_id,c.renter_id) ORDER BY r.created_at DESC`,[userId,conversationId]),
 ]);
 const typedCharges=charges as Charge[];
 const active=typedCharges.filter(r=>!r.voidedAt),totalPaidCentavos=active.reduce((n,r)=>n+Number(r.paidCentavos),0),outstandingCentavos=active.reduce((n,r)=>n+Number(r.balanceCentavos),0),overdueCentavos=active.filter(r=>r.status==="overdue").reduce((n,r)=>n+Number(r.balanceCentavos),0);
 const next=active.filter(r=>Number(r.balanceCentavos)>0).sort((a,b)=>a.dueOn.localeCompare(b.dueOn))[0];
 const ledger:LedgerSummary={totalPaidCentavos,outstandingCentavos,overdueCentavos,nextDueOn:next?.dueOn||null,nextDueCentavos:next?Number(next.balanceCentavos):0};
 return {tenancies:tenancies as Tenancy[],requests:requests as RentalRequest[],availableUnits:availableUnits as AvailableUnit[],charges:typedCharges,maintenance:maintenance as MaintenanceRequest[],documents:documents as RentalDocument[],reviews:reviews as RentalReview[],ledger};
}

export const emptyLifecycleState={requests:[] as RentalRequest[],availableUnits:[] as AvailableUnit[],maintenance:[] as MaintenanceRequest[],documents:[] as RentalDocument[],reviews:[] as RentalReview[],ledger:{totalPaidCentavos:0,outstandingCentavos:0,overdueCentavos:0,nextDueOn:null,nextDueCentavos:0} satisfies LedgerSummary};
