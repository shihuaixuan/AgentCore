CREATE TEMP VIEW raised_title_repair_candidates AS
SELECT id, "ownerUserId", name, "jobTitle", "updatedAt",
       CASE WHEN name COLLATE "C" = 'Software Engineer' THEN '软件工程师' ELSE name END AS proposed_name
FROM platform."Expert"
WHERE NOT "isTemplate" AND "sourceTemplateId" IS NULL AND "templateKey" IS NULL
  AND "ownerUserId" IS NOT NULL AND "jobTitle" COLLATE "C" = 'Software Engineer';

PREPARE preview_raised_title(text, text) AS
SELECT id, "ownerUserId", name, proposed_name, "jobTitle", '软件工程师' AS proposed_title, "updatedAt"
FROM pg_temp.raised_title_repair_candidates
WHERE "ownerUserId" = $1 AND id = $2;

PREPARE apply_raised_title(text, text, timestamp) AS
UPDATE pg_temp.raised_title_repair_candidates
SET name = proposed_name, "jobTitle" = '软件工程师', "updatedAt" = CURRENT_TIMESTAMP AT TIME ZONE 'UTC'
WHERE "ownerUserId" = $1 AND id = $2 AND "updatedAt" = $3
RETURNING id, "ownerUserId", name, "jobTitle", "updatedAt";
