BEGIN;
SELECT taxc.capture('rbt','1', :'tip') AS capture_D;
COMMIT;
