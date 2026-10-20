-- Follow-up hardening for migration 011: DELETE triggers do not have NEW.
-- Resolve the affected unit explicitly based on the trigger operation.
CREATE OR REPLACE FUNCTION sync_rental_unit_from_tenancies() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
 target uuid;
 active_count integer;
 pending_count integer;
BEGIN
 IF TG_OP='DELETE' THEN
  target=OLD.unit_id;
 ELSE
  target=NEW.unit_id;
 END IF;

 SELECT count(*) FILTER (WHERE status IN ('active','ending')),
        count(*) FILTER (WHERE status='invited')
 INTO active_count,pending_count
 FROM rental_tenancies
 WHERE unit_id=target;

 UPDATE rental_units
 SET status=CASE
   WHEN active_count>0 THEN 'occupied'
   WHEN pending_count>0 THEN 'reserved'
   ELSE 'available'
  END,
  updated_at=now()
 WHERE id=target AND status<>'unavailable';

 IF TG_OP='DELETE' THEN
  RETURN OLD;
 END IF;
 RETURN NEW;
END $$;
