import type { Database, SqlValue, Statement } from "sql.js";
import { readFields, rowAttribution } from "./qwenWorkAttribution";
import { ImportValidationError } from "./validation";

export const MAX_PROJECTED_ROWS = 2_000;
const MAX_PARTS_BYTES = 1024 * 1024;
const candidateChats = `
  FROM chats c
  WHERE c.deleted_at IS NULL AND typeof(c.id) = 'text' AND length(c.id) BETWEEN 1 AND 256
    AND EXISTS (SELECT 1 FROM messages m JOIN sub_chats s ON s.id=m.sub_chat_id
      WHERE m.chat_id=c.id AND s.chat_id=c.id AND m.role IN ('user','assistant'))`;

function tableColumns(db: Database, name: string, required = true) {
  const table = db.exec(`PRAGMA main.table_list('${name}')`)[0]?.values[0];
  if (!table && !required) return;
  if (table?.[1] !== name || table[2] !== "table")
    throw new ImportValidationError("qwenwork-database");
  return new Set(
    db.exec(`PRAGMA main.table_info('${name}')`)[0].values.map((col) => col[1]),
  );
}

function bounded(column: string, bytes: number) {
  return `CASE WHEN typeof(${column})='text' AND length(CAST(${column} AS BLOB)) <= ${bytes} THEN ${column} END`;
}

function* rows(
  statement: Statement,
  params: SqlValue[],
  limit = MAX_PROJECTED_ROWS,
) {
  statement.bind(params);
  try {
    for (let count = 0; statement.step(); count++) {
      if (count === limit) throw new ImportValidationError("conversation");
      yield statement.get();
    }
  } finally {
    statement.reset();
  }
}

const inputEvidence = `(SELECT CASE
  WHEN COUNT(*)=0 THEN NULL WHEN COUNT(*)<>1 THEN 'unknown'
  WHEN i.source='desktop' AND i.state='consumed' THEN 'direct'
  WHEN i.source IN ('system','mcp','cron') THEN 'internal' ELSE 'unknown' END
  FROM agent_turn_inputs i WHERE i.chat_id=m.chat_id AND i.sub_chat_id=m.sub_chat_id
    AND i.message_id=m.message_id)`;

export function prepareQwenWorkQueries(db: Database) {
  const chatCols = tableColumns(db, "chats")!;
  const subCols = tableColumns(db, "sub_chats")!;
  const msgCols = tableColumns(db, "messages")!;
  const inputs = tableColumns(db, "agent_turn_inputs", false);
  const runs = tableColumns(db, "task_run_logs", false);
  const total = db.exec(`SELECT COUNT(*) ${candidateChats}`)[0]?.values[0]?.[0];
  if (typeof total !== "number" || !Number.isSafeInteger(total) || total < 0)
    throw new ImportValidationError("qwenwork-database");

  const ext = chatCols.has("ext")
    ? bounded("coalesce(c.ext,'{}')", MAX_PARTS_BYTES)
    : "'{}'";
  const parent = chatCols.has("source_chat_id")
    ? "c.source_chat_id IS NOT NULL"
    : "0";
  const scheduled = runs
    ? "EXISTS (SELECT 1 FROM task_run_logs r WHERE r.chat_id=c.id)"
    : "0";
  const chats =
    db.prepare(`SELECT c.id, CASE WHEN length(c.name) <= 1000 THEN c.name END,
    CASE WHEN length(c.worktree_path) <= 1024 THEN c.worktree_path END, ${ext}, (${parent} OR ${scheduled})
    ${candidateChats} ORDER BY c.updated_at DESC, c.created_at DESC, c.id LIMIT ? OFFSET ?`);

  const legacy = !msgCols.has("metadata") && !inputs;
  const meta = msgCols.has("metadata")
    ? bounded("m.metadata", MAX_PARTS_BYTES)
    : "'{}'";
  const messageID = msgCols.has("message_id")
    ? bounded("m.message_id", 1024)
    : "NULL";
  const sessionID = subCols.has("session_id")
    ? bounded("s.session_id", 1024)
    : "NULL";
  const input = inputs
    ? `CASE WHEN m.role='user' THEN ${inputEvidence} END`
    : "NULL";
  const join = `FROM messages m JOIN sub_chats s ON s.id=m.sub_chat_id AND s.chat_id=m.chat_id
    WHERE m.chat_id=? AND m.role IN ('user','assistant')`;
  const members = db.prepare(
    `SELECT ${bounded("s.id", 1024)} FROM sub_chats s WHERE s.chat_id=? LIMIT 2`,
  );
  const identities = `${meta}, ${sessionID}, ${messageID}, ${input}`;
  const ownership = db.prepare(
    `SELECT ${bounded("s.id", 1024)}, m.role, ${identities} ${join} LIMIT ${MAX_PROJECTED_ROWS + 1}`,
  );
  const messages =
    db.prepare(`SELECT m.role, ${bounded("m.parts", MAX_PARTS_BYTES)}, m.created_at, m.sequence,
    ${identities} ${join} AND m.sub_chat_id=? ORDER BY m.sequence, m.id LIMIT ${MAX_PROJECTED_ROWS + 1}`);

  function publicThread(chat: string) {
    const subs = [...rows(members, [chat], 2)];
    if (subs.length === 1 && typeof subs[0][0] === "string" && subs[0][0])
      return { id: subs[0][0], omitted: false };
    if (!inputs) throw new ImportValidationError("conversation");

    const possible = new Set<SqlValue>();
    let chosen: string | undefined;
    for (const [sub, role, raw, session, message, input] of rows(ownership, [
      chat,
    ])) {
      if (role !== "user" && role !== "assistant") continue;
      const owner = rowAttribution(
        role,
        readFields(raw),
        session,
        message,
        input,
        false,
      );
      if (owner === "nested" || owner === "internal") continue;
      possible.add(sub);
      if (role !== "user" || owner !== "public" || input !== "direct") continue;
      if (typeof sub !== "string" || !sub || (chosen && chosen !== sub))
        throw new ImportValidationError("conversation");
      chosen = sub;
    }
    if (!chosen) throw new ImportValidationError("conversation");
    return { id: chosen, omitted: possible.size > 1 };
  }

  return {
    total,
    legacy,
    publicThread,
    pageRows: (limit: number, offset: number) =>
      rows(chats, [limit, offset], limit),
    messageRows: (chat: string, sub: string) => rows(messages, [chat, sub]),
  };
}
