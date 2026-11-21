import type { Database, SqlValue } from "sql.js";

const KIB = 1024;
const MAX_RAW_BYTES = 8 * KIB * KIB;
const MAX_PARTS = 1024;
const MAX_PRIVATE_PART_BYTES = 4 * KIB * KIB;
const MAX_PUBLIC_PART_BYTES = 256 * KIB;
const MAX_QUESTION_BYTES = 64 * KIB;
const MAX_PROJECTION_BYTES = KIB * KIB;
const MAX_FIELD_BYTES = 4 * KIB;

const nestedMarkers = [
  "parentToolUseId",
  "parent_tool_use_id",
  "parent_agent_id",
  "teamName",
  "isSidechain",
  "isMeta",
  "isSynthetic",
];
const auditKeys = [
  "type",
  "id",
  "state",
  "toolName",
  "toolCallId",
  ...nestedMarkers,
];
const source = "part.value";
const kind = "(part.value ->> '$.type')";
const fileWithData = `${kind} IN ('data-file','data-image')`;

function keys(names: string[]) {
  return names.map((name) => `'${name}'`).join(",");
}

function scalarField(object: string, limit = MAX_FIELD_BYTES) {
  return `CASE WHEN field.type NOT IN ('object','array')
    AND (field.type != 'text' OR octet_length(field.atom) <= ${limit})
    THEN (${object}) -> field.key END`;
}

function pickFields(object: string, predicate: string, fragment: string) {
  return `(SELECT CASE WHEN count(*)=count(DISTINCT key) AND count(*)=count(fragment)
    THEN json_group_object(key, json(fragment)) END FROM
    (SELECT field.key, ${fragment} AS fragment FROM json_each(${object}) field
     WHERE ${predicate}))`;
}

function subObject(name: string, keep: string[]) {
  const object = `(${source} -> '$.${name}')`;
  const selected = pickFields(
    object,
    `field.key IN (${keys(keep)})`,
    scalarField(object),
  );
  return `CASE field.type WHEN 'null' THEN 'null' WHEN 'object' THEN ${selected} END`;
}

const keptFields = `field.key IN (${keys([...auditKeys, "metadata"])})
  OR (field.key='childRun' AND ${kind}='child-run')
  OR (field.key='text' AND ${kind}='text')
  OR (field.key='filePath' AND ${kind}='file-content')
  OR (field.key='data' AND ${fileWithData})`;
const compactPart = pickFields(
  source,
  keptFields,
  `CASE field.key
  WHEN 'metadata' THEN ${subObject("metadata", [...nestedMarkers, "planKind"])}
  WHEN 'childRun' THEN ${subObject("childRun", ["id"])}
  WHEN 'data' THEN ${subObject("data", ["filePath"])}
  WHEN 'text' THEN ${source} -> '$.text'
  ELSE ${scalarField(source)} END`,
);

const projectPart = `CASE
  WHEN part.type!='object' OR octet_length(part.value)>${MAX_PRIVATE_PART_BYTES} THEN NULL
  WHEN json_type(part.value,'$.type') IS NOT 'text' OR length(trim(${kind}))=0 THEN NULL
  WHEN (SELECT count(*)>128 OR count(*)!=count(DISTINCT key) FROM
      (SELECT key FROM json_each(part.value) LIMIT 129)) THEN NULL
  WHEN coalesce(json_type(part.value,'$.id'),'null') NOT IN ('text','null')
    OR coalesce(json_type(part.value,'$.state'),'null') NOT IN ('text','null') THEN NULL
  WHEN ${kind}='tool-AskUserQuestion' THEN
    CASE WHEN octet_length(part.value)>${MAX_QUESTION_BYTES} THEN NULL
      WHEN NOT EXISTS (SELECT 1 FROM json_tree(part.value) WHERE typeof(key)='text'
        GROUP BY parent, key HAVING count(*)>1) THEN part.value END
  WHEN ${kind} IN ('text','file-content','data-file','data-image')
    AND octet_length(part.value)>${MAX_PUBLIC_PART_BYTES} THEN NULL
  WHEN ${kind}='text' AND json_type(part.value,'$.text') IS NOT 'text' THEN NULL
  WHEN ${kind}='file-content' AND json_type(part.value,'$.filePath') IS NOT 'text' THEN NULL
  WHEN ${fileWithData} AND json_type(part.value,'$.data.filePath') IS NOT 'text' THEN NULL
  ELSE ${compactPart} END`;

export function prepareLargeQwenWorkParts(
  db: Database,
): (rowID: SqlValue) => string | null {
  const decoder = new TextDecoder("utf-8", { fatal: true });
  const header = db.prepare(`SELECT CASE
    WHEN role='assistant' AND typeof(parts)='text' AND octet_length(parts) BETWEEN 2 AND ${MAX_RAW_BYTES}
    THEN CASE WHEN instr(CAST(parts AS BLOB), x'00')=0 AND json_valid(parts)
      THEN CASE WHEN json_type(parts)='array' THEN json_array_length(parts) END END END
    FROM main.messages WHERE id=? LIMIT 2`);
  const projection =
    db.prepare(`WITH projected(position, body) AS MATERIALIZED (
    SELECT part.key, ${projectPart}
    FROM main.messages AS message CROSS JOIN json_each(message.parts) AS part
    WHERE message.id=? AND message.role='assistant'
  ) SELECT CASE WHEN (SELECT count(*)=? AND count(body)=count(*)
       AND 1+count(*)+sum(octet_length(body))<=${MAX_PROJECTION_BYTES} FROM projected)
    THEN (SELECT CAST('[' || group_concat(body, ',' ORDER BY position) || ']' AS BLOB) FROM projected) END`);

  return function read(rowID) {
    if (
      typeof rowID !== "string" &&
      !(typeof rowID === "number" && Number.isSafeInteger(rowID))
    )
      return null;
    try {
      header.bind([rowID]);
      if (!header.step()) return null;
      const [count] = header.get();
      if (
        typeof count !== "number" ||
        count < 1 ||
        count > MAX_PARTS ||
        header.step()
      )
        return null;
      projection.bind([rowID, count]);
      if (!projection.step()) return null;
      const [raw] = projection.get();
      if (!(raw instanceof Uint8Array)) return null;
      try {
        return decoder.decode(raw);
      } catch {
        return null;
      }
    } finally {
      projection.reset();
      header.reset();
    }
  };
}
