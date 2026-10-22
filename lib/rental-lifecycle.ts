import "server-only";
import {neon} from "@neondatabase/serverless";
import type {RentalOperation} from "./rental-operation-input";
import type {AvailableUnit,Charge,LedgerSummary,MaintenanceRequest,PaymentProfile,PaymentSubmission,RentalDocument,RentalRequest,RentalReview,Reservation,Tenancy} from "./rental-operation-types";
import {dispatchPendingRentalPushes} from "./push-notifications";

const lifecycleActions=new Set([
 "requestRent","cancelRentRequest","approveRentRequest","declineRentRequest","submitReservationProof","confirmReservationPayment","rejectReservationProof","cancelReservation","activateTenancy","requestMoveOut",
 "submitPaymentProof","confirmPaymentProof","rejectPaymentProof","updatePaymentProfile","markEnding",
 "maintenanceCreate","maintenanceStatus","documentAdd","documentDelete","review",
]);
export function isLifecycleOperation(v:RentalOperation){return lifecycleActions.has(v.action);}
function client(){if(process.env.ENABLE_RENTAL_MANAGEMENT!=="true"||!process.env.DATABASE_URL)throw Error("Rental management is awaiting setup.");return neon(process.env.DATABASE_URL);}

const REQUEST_RENT=`WITH req AS (
 INSERT INTO rental_requests(conversation_id,unit_id,renter_id,desired_move_in_on)
 SELECT c.id,u.id,$1,$4::date FROM rental_conversations c JOIN rental_units u ON u.listing_id=c.listing_id
 WHERE c.id=$2::uuid AND c.renter_id=$1 AND u.id=$3::uuid AND u.status<>'unavailable'
  AND NOT EXISTS(SELECT 1 FROM rental_requests x WHERE x.conversation_id=c.id AND x.status='pending')
  AND NOT EXISTS(SELECT 1 FROM rental_tenancies t WHERE t.conversation_id=c.id AND t.status IN ('invited','reserved','active','ending'))
  AND NOT EXISTS(SELECT 1 FROM rental_reservations z WHERE z.conversation_id=c.id AND z.status IN ('awaiting_payment','proof_submitted','reserved'))
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

const APPROVE_REQUEST_HOLD=`WITH req AS MATERIALIZED (
 SELECT r.*,c.owner_id,c.renter_id FROM rental_requests r
 JOIN rental_conversations c ON c.id=r.conversation_id JOIN rental_units u ON u.id=r.unit_id
 WHERE r.id=$2::uuid AND r.status='pending' AND c.owner_id=$1 AND u.status<>'unavailable'
  AND $5::date<=$7::date AND ($6::text='' OR $6::date>=$5::date)
  AND ($10::text<>'first_rent' OR $9<=$3) AND ($10::text<>'deposit' OR $9<=$4)
  AND NOT EXISTS(SELECT 1 FROM rental_tenancies x WHERE x.conversation_id=c.id AND x.status IN ('invited','reserved','active','ending'))
  AND NOT EXISTS(SELECT 1 FROM rental_reservations z WHERE z.conversation_id=c.id AND z.status IN ('awaiting_payment','proof_submitted','reserved'))
 FOR UPDATE OF r,u
), hold AS (
 INSERT INTO rental_reservations(request_id,conversation_id,unit_id,renter_id,owner_id,status,amount_centavos,credit_target,monthly_rent_centavos,security_deposit_centavos,starts_on,move_in_on,lease_ends_on,owner_note,expires_at)
 SELECT id,conversation_id,unit_id,renter_id,owner_id,'awaiting_payment',$9,$10,$3,$4,$5::date,$7::date,NULLIF($6::text,'')::date,$8,now()+make_interval(hours=>$11) FROM req RETURNING *
), done AS (
 UPDATE rental_requests r SET status='approved',owner_note=$8,decided_at=now() FROM hold WHERE r.id=hold.request_id RETURNING r.*
), n AS (INSERT INTO rental_notifications(user_id,conversation_id,kind,body,event_key)
 SELECT renter_id,conversation_id,'reservation','Your rental request was approved. Complete the reservation payment before the hold expires.','reservation-approved:'||id FROM hold)
 SELECT id FROM hold`;

const APPROVE_REQUEST_FREE=`WITH req AS MATERIALIZED (
 SELECT r.*,c.owner_id,c.renter_id FROM rental_requests r
 JOIN rental_conversations c ON c.id=r.conversation_id JOIN rental_units u ON u.id=r.unit_id
 WHERE r.id=$2::uuid AND r.status='pending' AND c.owner_id=$1 AND u.status<>'unavailable'
  AND $5::date<=$7::date AND ($6::text='' OR $6::date>=$5::date)
  AND NOT EXISTS(SELECT 1 FROM rental_tenancies x WHERE x.conversation_id=c.id AND x.status IN ('invited','reserved','active','ending'))
  AND NOT EXISTS(SELECT 1 FROM rental_reservations z WHERE z.conversation_id=c.id AND z.status IN ('awaiting_payment','proof_submitted','reserved'))
 FOR UPDATE OF r,u
), hold AS (
 INSERT INTO rental_reservations(request_id,conversation_id,unit_id,renter_id,owner_id,status,amount_centavos,credit_target,monthly_rent_centavos,security_deposit_centavos,starts_on,move_in_on,lease_ends_on,owner_note,expires_at,confirmed_at)
 SELECT id,conversation_id,unit_id,renter_id,owner_id,'converted',0,'none',$3,$4,$5::date,$7::date,NULLIF($6::text,'')::date,$8,now(),now() FROM req RETURNING *
), t AS (
 INSERT INTO rental_tenancies(conversation_id,unit_id,status,monthly_rent_centavos,security_deposit_centavos,starts_on,lease_ends_on,move_in_on,approved_at)
 SELECT conversation_id,unit_id,'reserved',monthly_rent_centavos,security_deposit_centavos,starts_on,lease_ends_on,move_in_on,now() FROM hold RETURNING *
), linked AS (
 UPDATE rental_reservations r SET status='reserved',tenancy_id=t.id FROM t WHERE r.id=(SELECT id FROM hold) RETURNING r.*
), done AS (
 UPDATE rental_requests r SET status='approved',tenancy_id=t.id,owner_note=$8,decided_at=now() FROM t WHERE r.id=$2::uuid RETURNING r.*
), deposit_charge AS (
 INSERT INTO rent_charges(tenancy_id,due_on,description,amount_centavos,source,charge_kind)
 SELECT t.id,t.starts_on,'Security deposit',t.security_deposit_centavos,'manual','deposit' FROM t WHERE t.security_deposit_centavos>0 RETURNING id
), rent_charge AS (
 INSERT INTO rent_charges(tenancy_id,due_on,description,amount_centavos,source,charge_kind)
 SELECT t.id,t.starts_on,to_char(t.starts_on,'FMMonth YYYY')||' rent',t.monthly_rent_centavos,'manual','rent' FROM t RETURNING id
), n AS (INSERT INTO rental_notifications(user_id,conversation_id,kind,body,event_key)
 SELECT renter_id,conversation_id,'reservation','Your rental request was approved and the unit is reserved for your move-in.','reservation-confirmed:'||id FROM linked)
 SELECT id FROM linked`;

const DECLINE_REQUEST=`WITH req AS (
 UPDATE rental_requests r SET status='declined',owner_note=$3,decided_at=now() FROM rental_conversations c
 WHERE r.id=$2::uuid AND c.id=r.conversation_id AND c.owner_id=$1 AND r.status='pending' RETURNING r.*
), n AS (INSERT INTO rental_notifications(user_id,conversation_id,kind,body,event_key)
 SELECT c.renter_id,c.id,'rental_request','Your rental request was declined.','request-declined:'||req.id
 FROM req JOIN rental_conversations c ON c.id=req.conversation_id)
 SELECT id FROM req`;

const SUBMIT_RESERVATION_PROOF=`WITH r AS (
 UPDATE rental_reservations r SET status='proof_submitted',payment_method=$3,proof_url=$4,payment_reference=$5,submitted_at=now(),owner_note=''
 FROM rental_conversations c WHERE r.id=$2::uuid AND c.id=r.conversation_id AND c.renter_id=$1 AND r.status='awaiting_payment' AND r.expires_at>now()
  AND r.amount_centavos>0 AND ($3='cash' OR $4 IS NOT NULL) RETURNING r.*
), n AS (INSERT INTO rental_notifications(user_id,conversation_id,kind,body,event_key)
 SELECT owner_id,conversation_id,'payment_proof','Reservation payment proof was submitted for review.','reservation-proof:'||id||':'||extract(epoch from submitted_at)::bigint FROM r)
 SELECT id FROM r`;

const CONFIRM_RESERVATION=`WITH hold AS MATERIALIZED (
 UPDATE rental_reservations r SET status='converted',confirmed_at=now()
 FROM rental_conversations c WHERE r.id=$2::uuid AND c.id=r.conversation_id AND c.owner_id=$1 AND r.status='proof_submitted'
 RETURNING r.*
), t AS (
 INSERT INTO rental_tenancies(conversation_id,unit_id,status,monthly_rent_centavos,security_deposit_centavos,starts_on,lease_ends_on,move_in_on,approved_at)
 SELECT conversation_id,unit_id,'reserved',monthly_rent_centavos,security_deposit_centavos,starts_on,lease_ends_on,move_in_on,now() FROM hold RETURNING *
), linked AS (
 UPDATE rental_reservations r SET status='reserved',tenancy_id=t.id FROM t WHERE r.id=(SELECT id FROM hold) RETURNING r.*
), request_done AS (
 UPDATE rental_requests rr SET tenancy_id=t.id FROM t,hold WHERE rr.id=hold.request_id RETURNING rr.id
), deposit_charge AS (
 INSERT INTO rent_charges(tenancy_id,due_on,description,amount_centavos,source,charge_kind)
 SELECT t.id,t.starts_on,'Security deposit',t.security_deposit_centavos,'manual','deposit' FROM t WHERE t.security_deposit_centavos>0 RETURNING id,tenancy_id
), rent_charge AS (
 INSERT INTO rent_charges(tenancy_id,due_on,description,amount_centavos,source,charge_kind)
 SELECT t.id,t.starts_on,to_char(t.starts_on,'FMMonth YYYY')||' rent',t.monthly_rent_centavos,'manual','rent' FROM t RETURNING id,tenancy_id
), credited AS (
 INSERT INTO rent_payments(id,charge_id,amount_centavos,paid_on,note,recorded_by)
 SELECT gen_random_uuid(),CASE hold.credit_target WHEN 'deposit' THEN deposit_charge.id WHEN 'first_rent' THEN rent_charge.id END,
  hold.amount_centavos,(now() AT TIME ZONE 'Asia/Manila')::date,'Reservation payment credit',hold.owner_id
 FROM hold LEFT JOIN deposit_charge ON deposit_charge.tenancy_id=(SELECT id FROM t) LEFT JOIN rent_charge ON rent_charge.tenancy_id=(SELECT id FROM t)
 WHERE hold.amount_centavos>0 AND hold.credit_target IN ('deposit','first_rent') RETURNING id
), n AS (INSERT INTO rental_notifications(user_id,conversation_id,kind,body,event_key)
 SELECT renter_id,conversation_id,'reservation','Reservation payment confirmed. Your unit is now reserved.','reservation-confirmed:'||id FROM linked)
 SELECT id FROM linked`;

const REJECT_RESERVATION_PROOF=`WITH r AS (
 UPDATE rental_reservations r SET status='awaiting_payment',payment_method=NULL,proof_url=NULL,payment_reference='',submitted_at=NULL,owner_note=$3
 FROM rental_conversations c WHERE r.id=$2::uuid AND c.id=r.conversation_id AND c.owner_id=$1 AND r.status='proof_submitted' RETURNING r.*
), n AS (INSERT INTO rental_notifications(user_id,conversation_id,kind,body,event_key)
 SELECT renter_id,conversation_id,'payment_proof','Reservation payment proof needs attention: '||$3,'reservation-proof-rejected:'||id||':'||extract(epoch from now())::bigint FROM r)
 SELECT id FROM r`;

const CANCEL_RESERVATION=`WITH target AS MATERIALIZED (
 SELECT r.*,c.owner_id AS thread_owner,c.renter_id AS thread_renter FROM rental_reservations r JOIN rental_conversations c ON c.id=r.conversation_id
 WHERE r.id=$2::uuid AND $1 IN(c.owner_id,c.renter_id) AND r.status IN ('awaiting_payment','proof_submitted','reserved') FOR UPDATE OF r
), cancelled AS (
 UPDATE rental_reservations r SET status='cancelled',cancelled_at=now(),owner_note=CASE WHEN $3='' THEN r.owner_note ELSE $3 END FROM target WHERE r.id=target.id RETURNING r.*
), t AS (
 UPDATE rental_tenancies t SET status='declined' FROM cancelled WHERE t.id=cancelled.tenancy_id AND t.status='reserved' RETURNING t.id
), req AS (
 UPDATE rental_requests rr SET status='cancelled',decided_at=now() FROM cancelled WHERE rr.id=cancelled.request_id RETURNING rr.id
), n AS (INSERT INTO rental_notifications(user_id,conversation_id,kind,body,event_key)
 SELECT CASE WHEN $1=thread_owner THEN thread_renter ELSE thread_owner END,conversation_id,'reservation','The reservation was cancelled.'||CASE WHEN $3='' THEN '' ELSE ' '||$3 END,'reservation-cancel:'||id
 FROM target)
 SELECT id FROM cancelled`;

const ACTIVATE_TENANCY=`WITH t AS (
 UPDATE rental_tenancies t SET status='active',move_in_on=COALESCE(move_in_on,(now() AT TIME ZONE 'Asia/Manila')::date)
 FROM rental_conversations c WHERE t.id=$2::uuid AND c.id=t.conversation_id AND c.owner_id=$1 AND t.status='reserved' RETURNING t.*
), n AS (INSERT INTO rental_notifications(user_id,conversation_id,kind,body,event_key)
 SELECT c.renter_id,c.id,'tenancy','Move-in confirmed. Your tenancy is now active.','tenancy-active:'||t.id
 FROM t JOIN rental_conversations c ON c.id=t.conversation_id ON CONFLICT(event_key) DO NOTHING)
 SELECT id FROM t`;

const REQUEST_MOVE_OUT=`WITH t AS (
 UPDATE rental_tenancies t SET status='ending',ending_on=$3::date,lease_ends_on=COALESCE(lease_ends_on,$3::date)
 FROM rental_conversations c WHERE t.id=$2::uuid AND c.id=t.conversation_id AND c.renter_id=$1 AND t.status='active' AND $3::date>=t.starts_on RETURNING t.*
), n AS (INSERT INTO rental_notifications(user_id,conversation_id,kind,body,event_key)
 SELECT c.owner_id,c.id,'tenancy','Renter requested move-out on '||t.ending_on::text,'move-out-request:'||t.id||':'||t.ending_on::text
 FROM t JOIN rental_conversations c ON c.id=t.conversation_id ON CONFLICT(event_key) DO NOTHING)
 SELECT id FROM t`;

const SUBMIT_PAYMENT_PROOF=`WITH charge AS MATERIALIZED (
 SELECT r.id,r.amount_centavos-COALESCE((SELECT sum(p.amount_centavos) FROM rent_payments p WHERE p.charge_id=r.id AND p.voided_at IS NULL),0) AS balance,
  c.id AS conversation_id,c.owner_id,c.renter_id
 FROM rent_charges r JOIN rental_tenancies t ON t.id=r.tenancy_id JOIN rental_conversations c ON c.id=t.conversation_id
 WHERE r.id=$2::uuid AND c.renter_id=$1 AND r.voided_at IS NULL AND $3>0
  AND $3<=r.amount_centavos-COALESCE((SELECT sum(p.amount_centavos) FROM rent_payments p WHERE p.charge_id=r.id AND p.voided_at IS NULL),0)
), submission AS (
 INSERT INTO rent_payment_submissions(charge_id,renter_id,amount_centavos,paid_on,payment_method,proof_url,payment_reference,note)
 SELECT id,$1,$3,$4::date,$5,$6,$7,$8 FROM charge WHERE $5='cash' OR $6 IS NOT NULL RETURNING *
), n AS (INSERT INTO rental_notifications(user_id,conversation_id,kind,body,event_key)
 SELECT charge.owner_id,charge.conversation_id,'payment_proof','A rent payment was submitted for verification.','payment-proof:'||submission.id
 FROM submission JOIN charge ON charge.id=submission.charge_id)
 SELECT id FROM submission`;

const CONFIRM_PAYMENT_PROOF=`WITH submission AS MATERIALIZED (
 SELECT s.*,c.id AS conversation_id,c.owner_id,c.renter_id,
  r.amount_centavos-COALESCE((SELECT sum(p.amount_centavos) FROM rent_payments p WHERE p.charge_id=r.id AND p.voided_at IS NULL),0) AS balance
 FROM rent_payment_submissions s JOIN rent_charges r ON r.id=s.charge_id JOIN rental_tenancies t ON t.id=r.tenancy_id JOIN rental_conversations c ON c.id=t.conversation_id
 WHERE s.id=$2::uuid AND s.status='pending' AND c.owner_id=$1 AND r.voided_at IS NULL AND s.amount_centavos<=r.amount_centavos-COALESCE((SELECT sum(p.amount_centavos) FROM rent_payments p WHERE p.charge_id=r.id AND p.voided_at IS NULL),0)
 FOR UPDATE OF s,r
), payment AS (
 INSERT INTO rent_payments(id,charge_id,amount_centavos,paid_on,note,recorded_by)
 SELECT gen_random_uuid(),charge_id,amount_centavos,paid_on,CASE WHEN note='' THEN 'Verified renter payment' ELSE note END,$1 FROM submission RETURNING *
), done AS (
 UPDATE rent_payment_submissions s SET status='confirmed',payment_id=payment.id,reviewed_by=$1,reviewed_at=now(),rejection_reason=NULL FROM payment WHERE s.id=$2::uuid RETURNING s.*
), n AS (INSERT INTO rental_notifications(user_id,conversation_id,kind,body,event_key)
 SELECT submission.renter_id,submission.conversation_id,'payment','Payment confirmed and added to your rent ledger.','payment-proof-confirmed:'||done.id
 FROM done JOIN submission ON submission.id=done.id)
 SELECT id FROM done`;

const REJECT_PAYMENT_PROOF=`WITH submission AS (
 UPDATE rent_payment_submissions s SET status='rejected',reviewed_by=$1,reviewed_at=now(),rejection_reason=$3
 FROM rent_charges r JOIN rental_tenancies t ON t.id=r.tenancy_id JOIN rental_conversations c ON c.id=t.conversation_id
 WHERE s.id=$2::uuid AND s.charge_id=r.id AND c.owner_id=$1 AND s.status='pending' RETURNING s.*,c.id AS conversation_id,c.renter_id
), n AS (INSERT INTO rental_notifications(user_id,conversation_id,kind,body,event_key)
 SELECT renter_id,conversation_id,'payment_proof','Payment proof needs attention: '||$3,'payment-proof-rejected:'||id FROM submission)
 SELECT id FROM submission`;

const UPDATE_PAYMENT_PROFILE=`INSERT INTO owner_payment_profiles(owner_id,gcash_name,gcash_number,maya_name,maya_number,bank_label,bank_account_name,bank_account_number,accepts_cash,updated_at)
 SELECT $1,$2,$3,$4,$5,$6,$7,$8,$9,now() FROM users WHERE id=$1 AND role='landlord'
 ON CONFLICT(owner_id) DO UPDATE SET gcash_name=excluded.gcash_name,gcash_number=excluded.gcash_number,maya_name=excluded.maya_name,maya_number=excluded.maya_number,
 bank_label=excluded.bank_label,bank_account_name=excluded.bank_account_name,bank_account_number=excluded.bank_account_number,accepts_cash=excluded.accepts_cash,updated_at=now()
 RETURNING owner_id AS id`;

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
  case "approveRentRequest":query=v.reservationAmount>0?APPROVE_REQUEST_HOLD:APPROVE_REQUEST_FREE;args=v.reservationAmount>0?[userId,v.requestId,v.monthlyRent,v.securityDeposit,v.leaseStartsOn,v.leaseEndsOn||"",v.moveInOn,v.ownerNote,v.reservationAmount,v.reservationCredit,v.reservationHours]:[userId,v.requestId,v.monthlyRent,v.securityDeposit,v.leaseStartsOn,v.leaseEndsOn||"",v.moveInOn,v.ownerNote];break;
  case "declineRentRequest":query=DECLINE_REQUEST;args=[userId,v.requestId,v.ownerNote];break;
  case "submitReservationProof":query=SUBMIT_RESERVATION_PROOF;args=[userId,v.reservationId,v.paymentMethod,v.proofUrl,v.paymentReference];break;
  case "confirmReservationPayment":query=CONFIRM_RESERVATION;args=[userId,v.reservationId];break;
  case "rejectReservationProof":query=REJECT_RESERVATION_PROOF;args=[userId,v.reservationId,v.reason];break;
  case "cancelReservation":query=CANCEL_RESERVATION;args=[userId,v.reservationId,v.reason];break;
  case "activateTenancy":query=ACTIVATE_TENANCY;args=[userId,v.tenancyId];break;
  case "requestMoveOut":query=REQUEST_MOVE_OUT;args=[userId,v.tenancyId,v.endingOn];break;
  case "submitPaymentProof":query=SUBMIT_PAYMENT_PROOF;args=[userId,v.chargeId,v.amount,v.paidOn,v.paymentMethod,v.proofUrl,v.paymentReference,v.note];break;
  case "confirmPaymentProof":query=CONFIRM_PAYMENT_PROOF;args=[userId,v.submissionId];break;
  case "rejectPaymentProof":query=REJECT_PAYMENT_PROOF;args=[userId,v.submissionId,v.reason];break;
  case "updatePaymentProfile":query=UPDATE_PAYMENT_PROFILE;args=[userId,v.gcashName,v.gcashNumber,v.mayaName,v.mayaNumber,v.bankLabel,v.bankAccountName,v.bankAccountNumber,v.acceptsCash];break;
  case "markEnding":query=MARK_ENDING;args=[userId,v.tenancyId,v.endingOn];break;
  case "maintenanceCreate":query=MAINTENANCE_CREATE;args=[userId,v.tenancyId,v.title,v.description,v.priority,v.photoUrl];break;
  case "maintenanceStatus":query=MAINTENANCE_STATUS;args=[userId,v.requestId,v.status];break;
  case "documentAdd":query=DOCUMENT_ADD;args=[userId,v.tenancyId,v.kind,v.label,v.url];break;
  case "documentDelete":query=DOCUMENT_DELETE;args=[userId,v.documentId];break;
  case "review":query=REVIEW;args=[userId,v.tenancyId,v.targetType,v.rating,v.body];break;
  default:throw Error("Unsupported rental lifecycle action.");
 }
 const rows=await sql.query(query,args) as Array<{id:string}>;
 if(!rows.length)throw Error("Action unavailable. Check the rental status, payment details, unit capacity, and your access.");
 await dispatchPendingRentalPushes();
 const messages:Partial<Record<RentalOperation["action"],string>>={approveRentRequest:v.action==="approveRentRequest"&&v.reservationAmount>0?"Approved. The renter now has a payment hold.":"Approved. The unit is reserved.",submitReservationProof:"Proof submitted for owner review.",confirmReservationPayment:"Reservation confirmed. The unit is reserved.",rejectReservationProof:"Proof returned to the renter for correction.",cancelReservation:"Reservation cancelled.",activateTenancy:"Move-in confirmed. Tenancy is active.",requestMoveOut:"Move-out request sent to the owner.",submitPaymentProof:"Payment submitted for owner verification.",confirmPaymentProof:"Payment confirmed and added to the ledger.",rejectPaymentProof:"Payment proof returned to the renter.",updatePaymentProfile:"Payment methods updated."};
 return {id:rows[0].id,message:messages[v.action]||"Saved."};
}

const SYNC_EXPIRED_RESERVATIONS=`WITH expired AS (
 UPDATE rental_reservations SET status='expired',cancelled_at=now() WHERE status='awaiting_payment' AND expires_at<=now() RETURNING *
), renter_notice AS (
 INSERT INTO rental_notifications(user_id,conversation_id,kind,body,event_key)
 SELECT renter_id,conversation_id,'reservation','The reservation payment window expired. The unit is available again.','reservation-expired-renter:'||id FROM expired ON CONFLICT(event_key) DO NOTHING RETURNING id
), owner_notice AS (
 INSERT INTO rental_notifications(user_id,conversation_id,kind,body,event_key)
 SELECT owner_id,conversation_id,'reservation','A renter reservation payment window expired.','reservation-expired-owner:'||id FROM expired ON CONFLICT(event_key) DO NOTHING RETURNING id
) SELECT count(*)::int AS count FROM expired`;
const SYNC_AUTOMATIC_CHARGES=`WITH live AS (
 SELECT t.id,t.starts_on,t.lease_ends_on,t.monthly_rent_centavos FROM rental_tenancies t WHERE t.status IN ('active','ending')
), periods AS (
 SELECT date_trunc('month',(now() AT TIME ZONE 'Asia/Manila')::date)::date AS month_start
 UNION ALL SELECT (date_trunc('month',(now() AT TIME ZONE 'Asia/Manila')::date)+interval '1 month')::date
), dues AS (
 SELECT l.*,(p.month_start + (LEAST(EXTRACT(day FROM l.starts_on)::int,EXTRACT(day FROM (p.month_start+interval '1 month - 1 day'))::int)-1)*interval '1 day')::date AS due_on
 FROM live l CROSS JOIN periods p
), added AS (
 INSERT INTO rent_charges(tenancy_id,due_on,description,amount_centavos,source,charge_kind)
 SELECT d.id,d.due_on,to_char(d.due_on,'FMMonth YYYY')||' rent',d.monthly_rent_centavos,'automatic','rent' FROM dues d
 WHERE d.due_on>=d.starts_on AND (d.lease_ends_on IS NULL OR d.due_on<=d.lease_ends_on)
  AND NOT EXISTS(SELECT 1 FROM rent_charges r WHERE r.tenancy_id=d.id AND r.due_on=d.due_on AND r.charge_kind='rent' AND r.voided_at IS NULL)
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
 try{await sql.query(SYNC_EXPIRED_RESERVATIONS);await sql.query(SYNC_AUTOMATIC_CHARGES);await sql.query(SYNC_REMINDERS);await dispatchPendingRentalPushes();}catch{/* A newer lifecycle migration may still be rolling out. */}
}

export async function lifecycleState(userId:string,conversationId:string){
 const sql=client();await syncRentalLifecycle();
 const [tenancies,requests,reservations,availableUnits,charges,paymentSubmissions,paymentProfiles,maintenance,documents,reviews]=await Promise.all([
  sql.query(`SELECT t.id,t.unit_id AS "unitId",t.status,
    CASE t.status WHEN 'invited' THEN 'Pending' WHEN 'reserved' THEN 'Reserved' WHEN 'active' THEN 'Active' WHEN 'ending' THEN 'Ending' ELSE 'Ended' END AS "occupancyStatus",
    t.monthly_rent_centavos AS "monthlyRentCentavos",t.security_deposit_centavos AS "securityDepositCentavos",
    t.starts_on::text AS "startsOn",t.lease_ends_on::text AS "leaseEndsOn",t.move_in_on::text AS "moveInOn",t.ending_on::text AS "endingOn",t.ended_on::text AS "endedOn",u.label
   FROM rental_tenancies t JOIN rental_conversations c ON c.id=t.conversation_id JOIN rental_units u ON u.id=t.unit_id
   WHERE c.id=$2::uuid AND $1 IN(c.owner_id,c.renter_id) ORDER BY t.created_at DESC`,[userId,conversationId]),
  sql.query(`SELECT r.id,r.conversation_id AS "conversationId",r.unit_id AS "unitId",u.label AS "unitLabel",r.desired_move_in_on::text AS "desiredMoveInOn",
    r.status,r.tenancy_id AS "tenancyId",r.owner_note AS "ownerNote",r.created_at AS "createdAt",r.decided_at AS "decidedAt",r.renter_id=$1 AS mine
   FROM rental_requests r JOIN rental_conversations c ON c.id=r.conversation_id JOIN rental_units u ON u.id=r.unit_id
   WHERE c.id=$2::uuid AND $1 IN(c.owner_id,c.renter_id) ORDER BY r.created_at DESC`,[userId,conversationId]),
  sql.query(`SELECT r.id,r.request_id AS "requestId",r.conversation_id AS "conversationId",r.unit_id AS "unitId",u.label AS "unitLabel",r.renter_id AS "renterId",r.tenancy_id AS "tenancyId",r.status,
    r.amount_centavos AS "amountCentavos",r.credit_target AS "creditTarget",r.monthly_rent_centavos AS "monthlyRentCentavos",r.security_deposit_centavos AS "securityDepositCentavos",
    r.starts_on::text AS "startsOn",r.move_in_on::text AS "moveInOn",r.lease_ends_on::text AS "leaseEndsOn",r.payment_method AS "paymentMethod",r.proof_url AS "proofUrl",
    r.payment_reference AS "paymentReference",r.owner_note AS "ownerNote",r.expires_at AS "expiresAt",r.submitted_at AS "submittedAt",r.confirmed_at AS "confirmedAt",r.created_at AS "createdAt",r.renter_id=$1 AS mine
   FROM rental_reservations r JOIN rental_conversations c ON c.id=r.conversation_id JOIN rental_units u ON u.id=r.unit_id
   WHERE c.id=$2::uuid AND $1 IN(c.owner_id,c.renter_id) ORDER BY r.created_at DESC`,[userId,conversationId]),
  sql.query(`SELECT u.id,u.label,u.status,u.monthly_rent_centavos AS "monthlyRentCentavos",u.capacity,
    (SELECT count(*)::int FROM rental_tenancies t WHERE t.unit_id=u.id AND t.status IN ('invited','reserved','active','ending')) AS "liveTenants",
    (SELECT count(*)::int FROM rental_reservations r WHERE r.unit_id=u.id AND r.tenancy_id IS NULL AND r.status IN ('awaiting_payment','proof_submitted')) AS "activeHolds",
    GREATEST(0,u.capacity-(SELECT count(*)::int FROM rental_tenancies t WHERE t.unit_id=u.id AND t.status IN ('invited','reserved','active','ending'))-(SELECT count(*)::int FROM rental_reservations r WHERE r.unit_id=u.id AND r.tenancy_id IS NULL AND r.status IN ('awaiting_payment','proof_submitted'))) AS "availableSpots"
   FROM rental_conversations c JOIN rental_units u ON u.listing_id=c.listing_id
   WHERE c.id=$2::uuid AND $1 IN(c.owner_id,c.renter_id) AND u.status<>'unavailable' ORDER BY u.label`,[userId,conversationId]),
  sql.query(`SELECT r.id,r.tenancy_id AS "tenancyId",r.description,r.due_on::text AS "dueOn",r.amount_centavos AS "amountCentavos",
    COALESCE(sum(p.amount_centavos) FILTER(WHERE p.voided_at IS NULL),0)::bigint AS "paidCentavos",
    GREATEST(0,r.amount_centavos-COALESCE(sum(p.amount_centavos) FILTER(WHERE p.voided_at IS NULL),0))::bigint AS "balanceCentavos",
    max(p.paid_on)::text AS "lastPaidOn",r.source,r.charge_kind AS "chargeKind",r.voided_at AS "voidedAt",r.void_reason AS "voidReason",
    CASE WHEN r.voided_at IS NOT NULL THEN 'voided'
      WHEN COALESCE(sum(p.amount_centavos) FILTER(WHERE p.voided_at IS NULL),0)>=r.amount_centavos THEN 'paid'
      WHEN COALESCE(sum(p.amount_centavos) FILTER(WHERE p.voided_at IS NULL),0)>0 THEN 'partial'
      WHEN r.due_on<(now() AT TIME ZONE 'Asia/Manila')::date THEN 'overdue'
      WHEN r.due_on<=(now() AT TIME ZONE 'Asia/Manila')::date THEN 'due' ELSE 'upcoming' END AS status
   FROM rent_charges r JOIN rental_tenancies t ON t.id=r.tenancy_id JOIN rental_conversations c ON c.id=t.conversation_id
   LEFT JOIN rent_payments p ON p.charge_id=r.id WHERE c.id=$2::uuid AND $1 IN(c.owner_id,c.renter_id)
   GROUP BY r.id ORDER BY r.due_on DESC,r.charge_kind`,[userId,conversationId]),
  sql.query(`SELECT s.id,s.charge_id AS "chargeId",s.renter_id AS "renterId",s.amount_centavos AS "amountCentavos",s.paid_on::text AS "paidOn",s.payment_method AS "paymentMethod",
    s.proof_url AS "proofUrl",s.payment_reference AS "paymentReference",s.note,s.status,s.payment_id AS "paymentId",s.reviewed_at AS "reviewedAt",s.rejection_reason AS "rejectionReason",s.created_at AS "createdAt",s.renter_id=$1 AS mine
   FROM rent_payment_submissions s JOIN rent_charges r ON r.id=s.charge_id JOIN rental_tenancies t ON t.id=r.tenancy_id JOIN rental_conversations c ON c.id=t.conversation_id
   WHERE c.id=$2::uuid AND $1 IN(c.owner_id,c.renter_id) ORDER BY s.created_at DESC`,[userId,conversationId]),
  sql.query(`SELECT p.gcash_name AS "gcashName",p.gcash_number AS "gcashNumber",p.maya_name AS "mayaName",p.maya_number AS "mayaNumber",p.bank_label AS "bankLabel",
    p.bank_account_name AS "bankAccountName",p.bank_account_number AS "bankAccountNumber",p.accepts_cash AS "acceptsCash"
   FROM rental_conversations c LEFT JOIN owner_payment_profiles p ON p.owner_id=c.owner_id WHERE c.id=$2::uuid AND $1 IN(c.owner_id,c.renter_id) AND p.owner_id IS NOT NULL`,[userId,conversationId]),
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
 return {tenancies:tenancies as Tenancy[],requests:requests as RentalRequest[],reservations:reservations as Reservation[],availableUnits:availableUnits as AvailableUnit[],charges:typedCharges,paymentSubmissions:paymentSubmissions as PaymentSubmission[],paymentProfile:(paymentProfiles as PaymentProfile[])[0]||null,maintenance:maintenance as MaintenanceRequest[],documents:documents as RentalDocument[],reviews:reviews as RentalReview[],ledger};
}

export const emptyLifecycleState={requests:[] as RentalRequest[],reservations:[] as Reservation[],availableUnits:[] as AvailableUnit[],paymentSubmissions:[] as PaymentSubmission[],paymentProfile:null as PaymentProfile|null,maintenance:[] as MaintenanceRequest[],documents:[] as RentalDocument[],reviews:[] as RentalReview[],ledger:{totalPaidCentavos:0,outstandingCentavos:0,overdueCentavos:0,nextDueOn:null,nextDueCentavos:0} satisfies LedgerSummary};
