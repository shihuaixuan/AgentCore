\set ON_ERROR_STOP on
BEGIN;
UPDATE platform."Expert" hire
SET
  "name" = template."name",
  "role" = template."role",
  "jobTitle" = template."jobTitle",
  "tagline" = template."tagline",
  "bio" = template."bio",
  "identity" = template."identity",
  "categories" = template."categories",
  "updatedAt" = NOW()
FROM platform."Expert" template
WHERE hire."isTemplate" = false
  AND hire."sourceTemplateId" = template."id"
  AND template."isTemplate" = true
  AND hire."name" IN ('Casey', 'Devon', 'Quinn')
  AND template."name" IN ('凯西', '德文', '奎因');

DO $$
DECLARE changed_count integer;
BEGIN
  SELECT count(*) INTO changed_count
  FROM platform."Expert" hire
  JOIN platform."Expert" template ON template."id"=hire."sourceTemplateId"
  WHERE hire."isTemplate"=false
    AND template."name" IN ('凯西', '德文', '奎因')
    AND hire."name" IN ('凯西', '德文', '奎因');
  IF changed_count <> 3 THEN
    RAISE EXCEPTION 'team expert sync count mismatch: %', changed_count;
  END IF;
END $$;
COMMIT;
