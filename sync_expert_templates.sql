\set ON_ERROR_STOP on
BEGIN;
CREATE TEMP TABLE _expert_payload AS SELECT pg_read_file('/tmp/autogpt_expert_templates_sync.json')::jsonb AS doc;
CREATE TEMP TABLE _expert_templates AS SELECT value AS row FROM _expert_payload, jsonb_array_elements(doc);
DO $$
DECLARE expected_count integer; target_count integer; missing_count integer;
BEGIN
  SELECT count(*) INTO expected_count FROM _expert_templates;
  SELECT count(*) INTO target_count FROM platform."Expert" WHERE "isTemplate"=true AND "ownerUserId" IS NULL;
  IF expected_count <> target_count THEN
    RAISE EXCEPTION 'template count mismatch: source %, target %', expected_count, target_count;
  END IF;
  SELECT count(*) INTO missing_count FROM _expert_templates source
  WHERE NOT EXISTS (SELECT 1 FROM platform."Expert" target WHERE target."templateKey"=source.row->>'templateKey' AND target."isTemplate"=true AND target."ownerUserId" IS NULL);
  IF missing_count > 0 THEN RAISE EXCEPTION 'source template keys missing on target: %', missing_count; END IF;
END $$;
UPDATE platform."Expert" target
SET
  "name" = source.row->>'name',
  "avatarUrl" = NULLIF(source.row->>'avatarUrl',''),
  "color" = COALESCE(source.row->>'color',''),
  "role" = source.row->>'role',
  "jobTitle" = NULLIF(source.row->>'jobTitle',''),
  "tagline" = NULLIF(source.row->>'tagline',''),
  "identity" = source.row->>'identity',
  "bio" = NULLIF(source.row->>'bio',''),
  "skills" = COALESCE(ARRAY(SELECT jsonb_array_elements_text(source.row->'skills')), ARRAY[]::text[]),
  "categories" = COALESCE(ARRAY(SELECT jsonb_array_elements_text(source.row->'categories')), ARRAY[]::text[]),
  "voicePreferences" = COALESCE(source.row->>'voicePreferences',''),
  "boundaries" = COALESCE(source.row->>'boundaries',''),
  "toolProfile" = source.row->'toolProfile',
  "dayOne" = source.row->'dayOne',
  "isArchived" = COALESCE((source.row->>'isArchived')::boolean, false),
  "updatedAt" = NOW()
FROM _expert_templates source
WHERE target."templateKey" = source.row->>'templateKey'
  AND target."isTemplate" = true
  AND target."ownerUserId" IS NULL;
DO $$
DECLARE changed_count integer;
BEGIN
  SELECT count(*) INTO changed_count FROM platform."Expert" target JOIN _expert_templates source ON target."templateKey"=source.row->>'templateKey' WHERE target."isTemplate"=true AND target."ownerUserId" IS NULL AND target."name"=source.row->>'name';
  IF changed_count <> (SELECT count(*) FROM _expert_templates) THEN RAISE EXCEPTION 'expert sync count mismatch: %', changed_count; END IF;
END $$;
COMMIT;
