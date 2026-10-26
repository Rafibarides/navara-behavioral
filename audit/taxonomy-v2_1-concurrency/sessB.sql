BEGIN;
UPDATE taxc.item_tag_review SET surface_cluster_id='C_LIVE' WHERE item_id='1';
COMMIT;
