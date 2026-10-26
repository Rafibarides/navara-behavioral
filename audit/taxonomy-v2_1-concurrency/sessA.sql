BEGIN;
SELECT taxc.capture('rbt','1', (SELECT baseline_id FROM taxc.taxonomy_baseline WHERE item_id='1' ORDER BY baseline_seq DESC LIMIT 1)) AS capture_A;
SELECT pg_sleep(4);
COMMIT;
