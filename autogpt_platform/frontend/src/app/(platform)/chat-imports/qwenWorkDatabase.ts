import initSqlJs, {
  type Database,
  type SqlJsConfig,
  type SqlValue,
} from "sql.js";
import { MAX_QWENWORK_DB_BYTES, SQLITE_HEADER } from "./qwenWorkDirectory";
import { collectQwenWorkParts, qwenWorkTimestamp } from "./qwenWorkMessages";
import {
  encodeImport,
  ImportValidationError,
  MAX_MESSAGES,
  validateNativeConversation,
  type ImportMessage,
  type NativeChatDraft,
} from "./validation";

export const QWENWORK_PREVIEW_LIMIT = 100;
const MAX_PROJECTED_ROWS = 2_000;
const MAX_PARTS_BYTES = 1024 * 1024;

export type QwenWorkReadResult = {
  entries: NativeChatDraft[];
  skipped: number;
  page: number;
  hasOlder: boolean;
};

export async function readQwenWorkDatabase(
  raw: ArrayBuffer,
  page = 0,
  config?: SqlJsConfig,
): Promise<QwenWorkReadResult> {
  if (!globalThis.crypto?.subtle)
    throw new ImportValidationError("secure-context");
  const bytes = checkpointedSnapshot(raw);
  const sqlite = await initSqlJs(config);
  let db: Database | undefined;
  try {
    db = new sqlite.Database(bytes);
    db.run("PRAGMA trusted_schema = OFF; PRAGMA query_only = ON;");
    return await readProjectedChats(db, page);
  } catch (error) {
    if (error instanceof ImportValidationError) throw error;
    throw new ImportValidationError("qwenwork-database");
  } finally {
    db?.close();
  }
}

function checkpointedSnapshot(raw: ArrayBuffer) {
  if (raw.byteLength > MAX_QWENWORK_DB_BYTES)
    throw new ImportValidationError("qwenwork-db-size");
  const header = new Uint8Array(raw, 0, Math.min(100, raw.byteLength));
  if (
    header.length < 100 ||
    new TextDecoder().decode(header.subarray(0, SQLITE_HEADER.length)) !==
      SQLITE_HEADER
  ) {
    throw new ImportValidationError("qwenwork-database");
  }
  if (header[18] === 1 && header[19] === 1) return new Uint8Array(raw);
  if (header[18] === 2 && header[19] === 2) {
    const snapshot = new Uint8Array(raw.slice(0));
    snapshot.set([1, 1], 18);
    return snapshot;
  }
  throw new ImportValidationError("qwenwork-database");
}

async function readProjectedChats(
  db: Database,
  page: number,
): Promise<QwenWorkReadResult> {
  const tables = db.exec("PRAGMA main.table_list")[0]?.values ?? [];
  if (
    !["chats", "sub_chats", "messages"].every((name) =>
      tables.some(
        ([schema, table, kind]) =>
          schema === "main" && table === name && kind === "table",
      ),
    )
  ) {
    throw new ImportValidationError("qwenwork-database");
  }
  const chats =
    db.exec(
      `
    SELECT c.id, CASE WHEN length(c.name) <= 1000 THEN c.name END,
      CASE WHEN length(c.worktree_path) <= 1024 THEN c.worktree_path END
    FROM chats c
    WHERE c.deleted_at IS NULL AND typeof(c.id) = 'text' AND length(c.id) BETWEEN 1 AND 256
      AND EXISTS (SELECT 1 FROM messages m JOIN sub_chats s ON s.id=m.sub_chat_id
        WHERE m.chat_id=c.id AND s.chat_id=c.id AND m.role IN ('user','assistant'))
    ORDER BY c.updated_at DESC, c.created_at DESC, c.id
    LIMIT ? OFFSET ?`,
      [QWENWORK_PREVIEW_LIMIT + 1, page * QWENWORK_PREVIEW_LIMIT],
    )[0]?.values ?? [];

  const messageQuery = db.prepare(`
    SELECT m.role, CASE WHEN length(CAST(m.parts AS BLOB)) <= ? THEN m.parts END, m.created_at
    FROM messages m JOIN sub_chats s ON s.id=m.sub_chat_id AND s.chat_id=m.chat_id
    WHERE m.chat_id=? AND m.role IN ('user','assistant')
    ORDER BY s.created_at, s.id, m.sequence, m.id LIMIT ?`);
  const entries: NativeChatDraft[] = [];
  let skipped = 0;
  try {
    for (const chat of chats.slice(0, QWENWORK_PREVIEW_LIMIT)) {
      try {
        entries.push(await projectChat(chat, messageQuery));
      } catch (error) {
        if (!(error instanceof ImportValidationError)) throw error;
        skipped++;
      }
    }
  } finally {
    messageQuery.free();
  }
  return {
    entries,
    skipped,
    page,
    hasOlder: chats.length > QWENWORK_PREVIEW_LIMIT,
  };
}

async function projectChat(
  [id, name, path]: SqlValue[],
  query: ReturnType<Database["prepare"]>,
) {
  if (typeof id !== "string") throw new ImportValidationError("conversation");
  const cwd = typeof path === "string" && path.trim() ? path : undefined;
  const messages: ImportMessage[] = [];
  const references = new Set<string>();
  query.bind([MAX_PARTS_BYTES, id, MAX_PROJECTED_ROWS + 1]);
  for (let count = 0; query.step(); count++) {
    if (count === MAX_PROJECTED_ROWS)
      throw new ImportValidationError("conversation");
    const [role, parts, created] = query.get();
    if (role !== "assistant" && role !== "user") continue;
    const text = collectQwenWorkParts(parts, references);
    if (!text) continue;
    const timestamp = qwenWorkTimestamp(created);
    messages.push({ role, text, ...(timestamp ? { timestamp } : {}) });
    if (messages.length > MAX_MESSAGES)
      throw new ImportValidationError("conversation");
  }
  const title = typeof name === "string" ? name.trim() : "";
  const conversation = validateNativeConversation({
    source: "qwenwork",
    source_id: await hashChat(id),
    title: Array.from(title || "QwenWork")
      .slice(0, 200)
      .join(""),
    messages,
  });
  encodeImport([conversation]);
  return {
    conversation,
    cwd,
    references: [...references].map((path) => ({ path, cwd })),
  };
}

async function hashChat(id: string) {
  const hash = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(`qwenwork-db-v1\0${id}`),
  );
  return Array.from(new Uint8Array(hash), (byte) =>
    byte.toString(16).padStart(2, "0"),
  ).join("");
}
