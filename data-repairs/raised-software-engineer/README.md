# Repair one confirmed Chinese wizard submission

Do not translate every `Software Engineer`. In the affected wizard, `getRaiseProfession`
(`frontend/src/app/(platform)/raise/profession.ts` under `autogpt_platform`) localized
the displayed title but returned the raw suggestion for both `name` and `jobTitle`.
`useRaiseSubmission.ts` sent those values and the role, not the locale or whether the
user clicked a suggestion or typed the title. `_create_raised_expert_row` in
`backend/api/features/experts/experts_db.py` stored them on `Expert`.

The Prisma `Expert` model has no creation locale. Migration
`20260917160000_add_expert_job_title` added nullable text, not provenance;
`20260727070306_add_expert_entity` even sets `sourceTemplateId` to NULL on template
deletion. No template link is therefore a filter, not proof of wizard origin.
An English submission can match every field of a Chinese one. Neither the owner's
current locale nor Chinese text elsewhere proves that this title was unintended.
The existing `sync_expert_templates.sql` and `sync_hired_experts.sql` target
different populations. This repair deliberately does **not** run on deployment.

## Preview, then optionally write

1. Obtain the expert ID (e.g. from the reported expert's URL) and the verified
   owner ID. Confirm with the owner that `软件工程师` is the intended title and,
   when the name is also `Software Engineer`, that it should change too. If either
   the record or the intended values are ambiguous, stop.
2. From this directory, open a **fresh, direct psql session** to the intended
   PostgreSQL database (`psql -X -v ON_ERROR_STOP=1 ...`). Use a role with TEMP
   access and permission to inspect the row; writes additionally need UPDATE.
   Run the preview below. Loading the file only defines session-local objects.

   ```sql
   \encoding UTF8
   \conninfo
   \i repair.sql
   \prompt 'Confirmed owner ID: ' owner_id
   \prompt 'Confirmed expert ID: ' expert_id
   EXECUTE preview_raised_title(:'owner_id', :'expert_id');
   ```

3. Stop here for a dry run. Require **exactly one** row with the expected before
   and proposed values. Keep the preview with the support record. In the same
   session, to apply the reviewed change:

   ```sql
   \prompt 'Exact updatedAt from the preview: ' reviewed_at
   BEGIN;
   EXECUTE apply_raised_title(:'owner_id', :'expert_id', :'reviewed_at');
   ```

   Inspect `RETURNING`: only issue `COMMIT;` for `UPDATE 1` with the approved
   values; otherwise `ROLLBACK;`. `UPDATE 0` means no eligible current match:
   re-preview, do not weaken the predicates. Repeating a successful repair is a
   no-op. After commit, verify the stored values directly:

   ```sql
   SELECT id, name, "jobTitle" FROM platform."Expert"
   WHERE "ownerUserId" = :'owner_id' AND id = :'expert_id';
   ```

Only the exact old title is eligible. A renamed expert keeps its custom name.
The repair updates `updatedAt` but does not translate `role`, identity, bio,
historical chats, or other free text. If a committed change must be reversed,
use the captured before-values and check the row for subsequent edits first.

## Scratch verification

Against a disposable **empty** UTF-8 database only, run
`psql -X -f fixture.sql ...` from this directory. The fixture creates its own
schema (fails if `platform` already exists), includes the real repair, asserts
persisted values and exclusions, and rolls back. No application data is required.
