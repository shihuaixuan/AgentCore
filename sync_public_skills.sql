\set ON_ERROR_STOP on

BEGIN;

CREATE TEMP TABLE _skills_payload AS
SELECT pg_read_file('/tmp/autogpt_public_skills_sync.json')::jsonb AS doc;

CREATE TEMP TABLE _skill_listings AS
SELECT value AS row
FROM _skills_payload, jsonb_array_elements(doc->'listings');

CREATE TEMP TABLE _skill_versions AS
SELECT value AS row
FROM _skills_payload, jsonb_array_elements(doc->'versions');

CREATE TEMP TABLE _skill_files AS
SELECT value AS row
FROM _skills_payload, jsonb_array_elements(doc->'files');

CREATE TEMP TABLE _expert_skill_links AS
SELECT value AS row
FROM _skills_payload, jsonb_array_elements(doc->'expertSkillLinks');

DO $$
DECLARE
  conflicts integer;
BEGIN
  SELECT count(*)
  INTO conflicts
  FROM platform."SkillListing" target
  JOIN _skill_listings source ON source.row->>'slug' = target."slug"
  WHERE target."owningUserId" IS NOT NULL OR target."owningOrgId" IS NOT NULL;

  IF conflicts > 0 THEN
    RAISE EXCEPTION 'public skill import conflicts with % user-owned listing(s)', conflicts;
  END IF;

  SELECT count(*)
  INTO conflicts
  FROM platform."SkillListing" target
  JOIN _skill_listings source ON source.row->>'id' = target."id"
  WHERE target."owningUserId" IS NOT NULL OR target."owningOrgId" IS NOT NULL;

  IF conflicts > 0 THEN
    RAISE EXCEPTION 'public skill import conflicts with % user-owned listing ID(s)', conflicts;
  END IF;
END
$$;

DELETE FROM platform."SkillListing"
WHERE "owningUserId" IS NULL AND "owningOrgId" IS NULL;

INSERT INTO platform."SkillListing" (
  "id", "createdAt", "updatedAt", "isDeleted", "hasApprovedVersion", "slug",
  "activeVersionId", "installCount", "owningUserId", "owningOrgId"
)
SELECT
  row->>'id',
  (row->>'createdAt')::timestamptz,
  (row->>'updatedAt')::timestamptz,
  (row->>'isDeleted')::boolean,
  (row->>'hasApprovedVersion')::boolean,
  row->>'slug',
  NULL,
  (row->>'installCount')::integer,
  NULL,
  NULL
FROM _skill_listings;

INSERT INTO platform."SkillListingVersion" (
  "id", "version", "createdAt", "updatedAt", "name", "description", "body",
  "triggers", "categories", "requiredProviders", "scannedSha256", "packageSha256",
  "skillMarkdown", "sourceSkillSlug", "sourceRepo", "sourceUrl", "license",
  "isDeleted", "isAvailable", "submissionStatus", "submittedAt", "skillListingId",
  "changesSummary", "reviewerId", "internalComments", "reviewComments", "reviewedAt",
  "organizationId"
)
SELECT
  row->>'id',
  (row->>'version')::integer,
  (row->>'createdAt')::timestamptz,
  (row->>'updatedAt')::timestamptz,
  row->>'name',
  row->>'description',
  row->>'body',
  COALESCE(ARRAY(SELECT jsonb_array_elements_text(row->'triggers')), ARRAY[]::text[]),
  COALESCE(ARRAY(SELECT jsonb_array_elements_text(row->'categories')), ARRAY[]::text[]),
  COALESCE(ARRAY(SELECT jsonb_array_elements_text(row->'requiredProviders')), ARRAY[]::text[]),
  COALESCE(ARRAY(SELECT jsonb_array_elements_text(row->'scannedSha256')), ARRAY[]::text[]),
  NULLIF(row->>'packageSha256', ''),
  NULLIF(row->>'skillMarkdown', ''),
  NULLIF(row->>'sourceSkillSlug', ''),
  NULLIF(row->>'sourceRepo', ''),
  NULLIF(row->>'sourceUrl', ''),
  NULLIF(row->>'license', ''),
  (row->>'isDeleted')::boolean,
  (row->>'isAvailable')::boolean,
  (row->>'submissionStatus')::"SubmissionStatus",
  NULLIF(row->>'submittedAt', '')::timestamptz,
  row->>'skillListingId',
  NULLIF(row->>'changesSummary', ''),
  NULL,
  NULL,
  NULL,
  NULL,
  NULL
FROM _skill_versions;

UPDATE platform."SkillListing" listing
SET "activeVersionId" = NULLIF(source.row->>'activeVersionId', '')
FROM _skill_listings source
WHERE listing."id" = source.row->>'id';

INSERT INTO platform."SkillListingFile" (
  "id", "createdAt", "skillListingVersionId", "relativePath", "sizeBytes", "sha256",
  "mimeType", "isExecutable", "content"
)
SELECT
  row->>'id',
  (row->>'createdAt')::timestamptz,
  row->>'skillListingVersionId',
  row->>'relativePath',
  (row->>'sizeBytes')::integer,
  row->>'sha256',
  NULLIF(row->>'mimeType', ''),
  (row->>'isExecutable')::boolean,
  decode(row->>'contentBase64', 'base64')
FROM _skill_files;

INSERT INTO platform."ExpertSkillListing" (
  "expertId", "skillListingId", "position", "createdAt"
)
SELECT
  expert.id,
  listing.id,
  (link.row->>'position')::integer,
  (link.row->>'createdAt')::timestamptz
FROM _expert_skill_links link
JOIN platform."Expert" expert
  ON expert."templateKey" = link.row->>'templateKey'
  AND expert."isTemplate" = true
JOIN platform."SkillListing" listing
  ON listing."slug" = link.row->>'slug'
  AND listing."owningUserId" IS NULL
  AND listing."owningOrgId" IS NULL;

DO $$
DECLARE
  expected_listings integer;
  actual_listings integer;
  expected_versions integer;
  actual_versions integer;
  expected_files integer;
  actual_files integer;
  expected_links integer;
  actual_links integer;
BEGIN
  SELECT count(*) INTO expected_listings FROM _skill_listings;
  SELECT count(*) INTO expected_versions FROM _skill_versions;
  SELECT count(*) INTO expected_files FROM _skill_files;
  SELECT count(*) INTO expected_links FROM _expert_skill_links;

  SELECT count(*) INTO actual_listings FROM platform."SkillListing"
  WHERE "owningUserId" IS NULL AND "owningOrgId" IS NULL;
  SELECT count(*) INTO actual_versions FROM platform."SkillListingVersion" version
  JOIN platform."SkillListing" listing ON listing.id = version."skillListingId"
  WHERE listing."owningUserId" IS NULL AND listing."owningOrgId" IS NULL;
  SELECT count(*) INTO actual_files FROM platform."SkillListingFile" file
  JOIN platform."SkillListingVersion" version ON version.id = file."skillListingVersionId"
  JOIN platform."SkillListing" listing ON listing.id = version."skillListingId"
  WHERE listing."owningUserId" IS NULL AND listing."owningOrgId" IS NULL;
  SELECT count(*) INTO actual_links FROM platform."ExpertSkillListing" link
  JOIN platform."Expert" expert ON expert.id = link."expertId"
  JOIN platform."SkillListing" listing ON listing.id = link."skillListingId"
  WHERE expert."isTemplate" = true
    AND listing."owningUserId" IS NULL
    AND listing."owningOrgId" IS NULL;

  IF actual_listings <> expected_listings
     OR actual_versions <> expected_versions
     OR actual_files <> expected_files
     OR actual_links <> expected_links THEN
    RAISE EXCEPTION 'sync count mismatch: listings %, versions %, files %, links % (expected %, %, %, %)',
      actual_listings, actual_versions, actual_files, actual_links,
      expected_listings, expected_versions, expected_files, expected_links;
  END IF;
END
$$;

COMMIT;
