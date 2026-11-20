\set ON_ERROR_STOP on
BEGIN;
CREATE SCHEMA platform;
CREATE TABLE platform."Expert" (
    id text PRIMARY KEY, "ownerUserId" text, name text NOT NULL,
    "jobTitle" text, role text NOT NULL DEFAULT 'Developer',
    "isTemplate" boolean NOT NULL DEFAULT false, "sourceTemplateId" text,
    "templateKey" text, "updatedAt" timestamp(3) NOT NULL DEFAULT '2026-01-01'
);
INSERT INTO platform."Expert" (id, "ownerUserId", name, "jobTitle")
SELECT id, 'owner', 'Software Engineer', 'Software Engineer'
FROM unnest(ARRAY['reported','english','renamed','hire','template','keyed','edited','stale']) AS id;
UPDATE platform."Expert" SET name = '小林' WHERE id = 'renamed';
UPDATE platform."Expert" SET "sourceTemplateId" = 'template' WHERE id = 'hire';
UPDATE platform."Expert" SET "isTemplate" = true WHERE id = 'template';
UPDATE platform."Expert" SET "templateKey" = 'roster' WHERE id = 'keyed';
UPDATE platform."Expert" SET "jobTitle" = 'Senior Software Engineer' WHERE id = 'edited';
CREATE TEMP TABLE original_rows AS SELECT * FROM platform."Expert";

\ir repair.sql
EXECUTE preview_raised_title('owner', 'reported');
DO $$ BEGIN
    IF EXISTS (TABLE platform."Expert" EXCEPT TABLE original_rows) THEN
        RAISE EXCEPTION 'Loading or previewing the repair wrote data';
    END IF;
END $$;

EXECUTE apply_raised_title('wrong-owner', 'english', '2026-01-01');
EXECUTE apply_raised_title('owner', 'hire', '2026-01-01');
EXECUTE apply_raised_title('owner', 'template', '2026-01-01');
EXECUTE apply_raised_title('owner', 'keyed', '2026-01-01');
EXECUTE apply_raised_title('owner', 'edited', '2026-01-01');
EXECUTE apply_raised_title('owner', 'stale', '2025-12-31');
EXECUTE apply_raised_title('owner', 'reported', '2026-01-01');
EXECUTE apply_raised_title('owner', 'renamed', '2026-01-01');
CREATE TEMP TABLE after_apply AS SELECT * FROM platform."Expert";
EXECUTE apply_raised_title('owner', 'reported', CURRENT_TIMESTAMP::timestamp(3));

DO $$ BEGIN
    IF NOT EXISTS (SELECT FROM platform."Expert" WHERE id = 'reported'
                   AND name = '软件工程师' AND "jobTitle" = name AND role = 'Developer'
                   AND "updatedAt" <> '2026-01-01')
       OR NOT EXISTS (SELECT FROM platform."Expert" WHERE id = 'renamed'
                      AND name = '小林' AND "jobTitle" = '软件工程师')
       OR EXISTS (SELECT * FROM original_rows WHERE id NOT IN ('reported', 'renamed')
                  EXCEPT TABLE platform."Expert")
       OR EXISTS (TABLE after_apply EXCEPT TABLE platform."Expert") THEN
        RAISE EXCEPTION 'Unexpected persisted values or scope';
    END IF;
END $$;
ROLLBACK;
