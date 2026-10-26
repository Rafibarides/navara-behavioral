BEGIN;
SELECT taxc.capture('rbt','1', :'tip') AS capture_C;
SELECT pg_sleep(3);
COMMIT;
