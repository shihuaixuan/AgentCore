import initSqlJs, {
  type Database,
  type SqlJsConfig,
  type SqlValue,
} from "sql.js";
import { nativeSourceID } from "./nativeSourceID";
import { MAX_QWENWORK_DB_BYTES, SQLITE_HEADER } from "./qwenWorkDirectory";
import { collectQwenWorkParts, qwenWorkTimestamp } from "./qwenWorkMessages";
import {
  encodeImport,
  ImportValidationError,
  MAX_BODY_BYTES,
  MAX_MESSAGES,
  validateNativeConversation,
  type ImportMessage,
  type NativeChatDraft,
} from "./validation";

export const QWENWORK_PREVIEW_LIMIT = 100;
const MAX_PROJECTED_ROWS = 2_000;
const MAX_PARTS_BYTES = 1024 * 1024;
const candidateChats = `
  FROM chats c
  WHERE c.deleted_at IS NULL AND typeof(c.id) = 'text' AND length(c.id) BETWEEN 1 AND 256
    AND EXISTS (SELECT 1 FROM messages m JOIN sub_chats s ON s.id=m.sub_chat_id
      WHERE m.chat_id=c.id AND s.chat_id=c.id AND m.role IN ('user','assistant'))`;

export type QwenWorkReadResult = {
  entries: NativeChatDraft[];
  skipped: number;
  page: number;
  hasOlder: boolean;
};

export type QwenWorkDatabaseReader = {
  total: number;
  readPage(page: number): QwenWorkReadResult;
  close(): void;
};

export async function readQwenWorkDatabase(
  raw: ArrayBuffer,
  page = 0,
  config?: SqlJsConfig,
): Promise<QwenWorkReadResult> {
  const reader = await openQwenWorkDatabase(raw, config);
  try {
    return reader.readPage(page);
  } finally {
    reader.close();
  }
}

export async function openQwenWorkDatabase(
  raw: ArrayBuffer,
  config?: SqlJsConfig,
): Promise<QwenWorkDatabaseReader> {
  const bytes = checkpointedSnapshot(raw);
  const sqlite = await initSqlJs(config);
  let db: Database | undefined;
  try {
    db = new sqlite.Database(bytes);
    db.run("PRAGMA trusted_schema = OFF; PRAGMA query_only = ON;");
    return openSnapshot(db);
  } catch (error) {
    db?.close();
    if (error instanceof ImportValidationError) throw error;
    throw new ImportValidationError("qwenwork-database");
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

function openSnapshot(db: Database): QwenWorkDatabaseReader {
  for (const name of ["chats", "sub_chats", "messages"]) {
    const table = db.exec(`PRAGMA main.table_list('${name}')`)[0]?.values[0];
    if (table?.[1] !== name || table[2] !== "table")
      throw new ImportValidationError("qwenwork-database");
  }
  const count = db.exec(`SELECT COUNT(*) ${candidateChats}`)[0]?.values[0]?.[0];
  if (typeof count !== "number" || !Number.isSafeInteger(count) || count < 0)
    throw new ImportValidationError("qwenwork-database");
  const total = count;
  const chats = db.prepare(`
    SELECT c.id, CASE WHEN length(c.name) <= 1000 THEN c.name END,
      CASE WHEN length(c.worktree_path) <= 1024 THEN c.worktree_path END
    ${candidateChats}
    ORDER BY c.updated_at DESC, c.created_at DESC, c.id
    LIMIT ? OFFSET ?`);
  const messages = db.prepare(`
    SELECT m.role, CASE WHEN length(CAST(m.parts AS BLOB)) <= ? THEN m.parts END, m.created_at
    FROM messages m JOIN sub_chats s ON s.id=m.sub_chat_id AND s.chat_id=m.chat_id
    WHERE m.chat_id=? AND m.role IN ('user','assistant')
    ORDER BY s.created_at, s.id, m.sequence, m.id LIMIT ?`);
  let closed = false;

  function close() {
    if (closed) return;
    closed = true;
    db.close();
  }

  function readPage(page: number) {
    if (closed) throw new ImportValidationError("qwenwork-reader");
    try {
      if (!Number.isSafeInteger(page) || page < 0)
        throw new ImportValidationError("qwenwork-reader");
      return readProjectedChats(chats, messages, total, page);
    } catch (error) {
      close();
      if (error instanceof ImportValidationError) throw error;
      throw new ImportValidationError("qwenwork-database");
    }
  }

  return { total, readPage, close };
}

type Statement = ReturnType<Database["prepare"]>;

function readProjectedChats(
  chats: Statement,
  messages: Statement,
  total: number,
  page: number,
): QwenWorkReadResult {
  const entries: NativeChatDraft[] = [];
  if (page >= Math.ceil(total / QWENWORK_PREVIEW_LIMIT))
    return { entries, skipped: 0, page, hasOlder: false };

  const offset = page * QWENWORK_PREVIEW_LIMIT;
  let skipped = 0;
  chats.bind([QWENWORK_PREVIEW_LIMIT, offset]);
  try {
    while (chats.step()) {
      try {
        entries.push(projectChat(chats.get(), messages));
      } catch (error) {
        if (!(error instanceof ImportValidationError)) throw error;
        skipped++;
      }
    }
  } finally {
    chats.reset();
    messages.reset();
  }
  return {
    entries,
    skipped,
    page,
    hasOlder: offset + QWENWORK_PREVIEW_LIMIT < total,
  };
}

function projectChat([id, name, path]: SqlValue[], query: Statement) {
  if (typeof id !== "string") throw new ImportValidationError("conversation");
  const cwd = typeof path === "string" && path.trim() ? path : undefined;
  const messages: ImportMessage[] = [];
  const references = new Set<string>();
  let textLength = 0;
  query.bind([MAX_PARTS_BYTES, id, MAX_PROJECTED_ROWS + 1]);
  for (let count = 0; query.step(); count++) {
    if (count === MAX_PROJECTED_ROWS)
      throw new ImportValidationError("conversation");
    const [role, parts, created] = query.get();
    if (role !== "assistant" && role !== "user") continue;
    const text = collectQwenWorkParts(parts, references, role);
    if (!text) continue;
    textLength += text.length;
    if (textLength > MAX_BODY_BYTES || messages.length >= MAX_MESSAGES)
      throw new ImportValidationError("conversation");
    const timestamp = qwenWorkTimestamp(created);
    messages.push({ role, text, ...(timestamp ? { timestamp } : {}) });
  }
  const title = typeof name === "string" ? name.trim() : "";
  const conversation = validateNativeConversation({
    source: "qwenwork",
    source_id: nativeSourceID("qwenwork", id),
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
