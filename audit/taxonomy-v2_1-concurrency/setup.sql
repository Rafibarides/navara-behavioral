-- Scratch-schema concurrency harness for taxonomy v2.1 capture locking and chain ordering.
-- Engine-level evidence on exact v2.1 DDL shapes; end-to-end role-aware races remain
-- post-implementation. Schema dropped at the end of the driver; zero residue.
DROP SCHEMA IF EXISTS taxc CASCADE;
CREATE SCHEMA taxc;
CREATE TABLE taxc.item_tag_review (
  track text NOT NULL, item_id text NOT NULL, content_version text NOT NULL,
  raw_tag text NOT NULL, surface_cluster_id text, reviewed_at timestamptz,
  PRIMARY KEY (track,item_id,content_version,raw_tag));
CREATE TABLE taxc.review_event (
  event_id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  table_name text NOT NULL, op text NOT NULL, old_row jsonb, new_row jsonb,
  at timestamptz NOT NULL DEFAULT now());
CREATE OR REPLACE FUNCTION taxc.log_review_event() RETURNS trigger LANGUAGE plpgsql SET search_path='' AS $$
BEGIN
  INSERT INTO taxc.review_event(table_name,op,old_row,new_row) VALUES
   (TG_TABLE_NAME, TG_OP,
    CASE WHEN TG_OP IN ('UPDATE','DELETE') THEN to_jsonb(OLD) END,
    CASE WHEN TG_OP IN ('INSERT','UPDATE') THEN to_jsonb(NEW) END);
  RETURN NULL;
END $$;
CREATE TRIGGER log_item_tag_review AFTER INSERT OR UPDATE OR DELETE ON taxc.item_tag_review
  FOR EACH ROW EXECUTE FUNCTION taxc.log_review_event();
CREATE TABLE taxc.taxonomy_baseline (
  baseline_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  track text NOT NULL, item_id text NOT NULL, row_mapping jsonb NOT NULL,
  event_horizon bigint NOT NULL, captured_at timestamptz NOT NULL DEFAULT now(),
  supersedes uuid, superseded_failure boolean NOT NULL DEFAULT false,
  baseline_seq bigint GENERATED ALWAYS AS IDENTITY);
CREATE UNIQUE INDEX ON taxc.taxonomy_baseline (baseline_seq);
CREATE OR REPLACE FUNCTION taxc.audit(p_track text, p_item text)
RETURNS text LANGUAGE plpgsql STABLE SET search_path = '' AS $f$
DECLARE b record; e record; expected jsonb; live jsonb; k text;
BEGIN
  SELECT * INTO b FROM taxc.taxonomy_baseline WHERE track=p_track AND item_id=p_item ORDER BY baseline_seq DESC LIMIT 1;
  IF NOT FOUND THEN RETURN 'unattested'; END IF;
  expected := b.row_mapping;
  FOR e IN SELECT op, old_row, new_row FROM taxc.review_event
           WHERE table_name='item_tag_review' AND event_id > b.event_horizon
             AND coalesce(old_row->>'track', new_row->>'track') = p_track
             AND coalesce(old_row->>'item_id', new_row->>'item_id') = p_item
           ORDER BY event_id
  LOOP
    k := coalesce(e.new_row->>'raw_tag', e.old_row->>'raw_tag') || '@' || coalesce(e.new_row->>'content_version', e.old_row->>'content_version');
    IF e.op = 'INSERT' THEN
      IF expected ? k THEN RETURN 'chain_gap'; END IF;
      expected := jsonb_set(expected, ARRAY[k], e.new_row);
    ELSIF e.op = 'UPDATE' THEN
      IF NOT (expected ? k) OR ((expected->k) - 'reviewed_at') IS DISTINCT FROM (e.old_row - 'reviewed_at') THEN RETURN 'chain_gap'; END IF;
      expected := jsonb_set(expected, ARRAY[k], e.new_row);
    ELSIF e.op = 'DELETE' THEN
      IF NOT (expected ? k) OR ((expected->k) - 'reviewed_at') IS DISTINCT FROM (e.old_row - 'reviewed_at') THEN RETURN 'chain_gap'; END IF;
      expected := expected - k;
    END IF;
  END LOOP;
  SELECT coalesce(jsonb_object_agg(t.raw_tag||'@'||t.content_version, to_jsonb(t)), '{}'::jsonb) INTO live
  FROM taxc.item_tag_review t WHERE t.track = p_track AND t.item_id = p_item;
  IF (SELECT coalesce(jsonb_object_agg(key, value - 'reviewed_at'), '{}'::jsonb) FROM jsonb_each(expected))
     IS DISTINCT FROM
     (SELECT coalesce(jsonb_object_agg(key, value - 'reviewed_at'), '{}'::jsonb) FROM jsonb_each(live)) THEN
    RETURN 'drift';
  END IF;
  RETURN 'verified';
END $f$;
CREATE OR REPLACE FUNCTION taxc.capture(p_track text, p_item text, p_supersedes uuid DEFAULT NULL)
RETURNS uuid LANGUAGE plpgsql SET search_path = '' AS $f$
DECLARE v_horizon bigint; v_mapping jsonb; v_id uuid; v_prior record; v_failed boolean := false;
BEGIN
  LOCK TABLE taxc.item_tag_review IN SHARE ROW EXCLUSIVE MODE;
  LOCK TABLE taxc.review_event IN SHARE MODE;
  IF p_supersedes IS NOT NULL THEN
    SELECT * INTO v_prior FROM taxc.taxonomy_baseline WHERE track=p_track AND item_id=p_item ORDER BY baseline_seq DESC LIMIT 1;
    IF NOT FOUND OR v_prior.baseline_id <> p_supersedes THEN
      RAISE EXCEPTION 'supersedes must name the CURRENT latest baseline of this item'; END IF;
    IF taxc.audit(p_track,p_item) IN ('drift','chain_gap') OR v_prior.superseded_failure THEN v_failed := true; END IF;
  END IF;
  SELECT coalesce(max(event_id),0) INTO v_horizon FROM taxc.review_event WHERE table_name='item_tag_review';
  SELECT coalesce(jsonb_object_agg(t.raw_tag||'@'||t.content_version, to_jsonb(t)), '{}'::jsonb) INTO v_mapping
  FROM taxc.item_tag_review t WHERE t.track=p_track AND t.item_id=p_item;
  INSERT INTO taxc.taxonomy_baseline (track,item_id,row_mapping,event_horizon,supersedes,superseded_failure)
  VALUES (p_track,p_item,v_mapping,v_horizon,p_supersedes,v_failed) RETURNING baseline_id INTO v_id;
  RETURN v_id;
END $f$;
INSERT INTO taxc.item_tag_review VALUES ('rbt','1','current','tag_x','C_TEST',now());
SELECT taxc.capture('rbt','1') AS initial_baseline;
