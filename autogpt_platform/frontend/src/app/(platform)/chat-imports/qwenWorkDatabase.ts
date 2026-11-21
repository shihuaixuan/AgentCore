import initSqlJs, {
  type Database,
  type SqlJsConfig,
  type SqlValue,
} from "sql.js";
import { nativeSourceID } from "./nativeSourceID";
import {
  readFields,
  requireNativeChat,
  rowAttribution,
  trackPublicTurns,
} from "./qwenWorkAttribution";
import { MAX_QWENWORK_DB_BYTES, SQLITE_HEADER } from "./qwenWorkDirectory";
import { collectQwenWorkParts, qwenWorkTimestamp } from "./qwenWorkMessages";
import { prepareQwenWorkQueries } from "./qwenWorkQueries";
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
  const queries = prepareQwenWorkQueries(db);
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
      return readProjectedChats(queries, page);
    } catch (error) {
      close();
      if (error instanceof ImportValidationError) throw error;
      throw new ImportValidationError("qwenwork-database");
    }
  }

  return { total: queries.total, readPage, close };
}

type Queries = ReturnType<typeof prepareQwenWorkQueries>;

function readProjectedChats(
  queries: Queries,
  page: number,
): QwenWorkReadResult {
  const { total } = queries;
  const entries: NativeChatDraft[] = [];
  if (page >= Math.ceil(total / QWENWORK_PREVIEW_LIMIT))
    return { entries, skipped: 0, page, hasOlder: false };

  const offset = page * QWENWORK_PREVIEW_LIMIT;
  let skipped = 0;
  for (const chat of queries.pageRows(QWENWORK_PREVIEW_LIMIT, offset)) {
    try {
      entries.push(projectChat(chat, queries));
    } catch (error) {
      if (!(error instanceof ImportValidationError)) throw error;
      skipped++;
    }
  }
  return {
    entries,
    skipped,
    page,
    hasOlder: offset + QWENWORK_PREVIEW_LIMIT < total,
  };
}

function projectChat(
  [id, name, path, ext, execution, task]: SqlValue[],
  queries: Queries,
): NativeChatDraft {
  if (typeof id !== "string") throw new ImportValidationError("conversation");
  requireNativeChat(ext, execution);
  const thread = queries.publicThread(id, task === 1);
  const cwd = typeof path === "string" && path.trim() ? path : undefined;
  const messages: ImportMessage[] = [];
  const references = new Set<string>();
  let textLength = 0;
  let omitted = thread.omitted;
  const activeTurns = trackPublicTurns(queries.legacy);
  const recoveredTurns = trackPublicTurns(false);
  let previousSequence = -1;
  for (const [
    role,
    parts,
    created,
    sequence,
    raw,
    session,
    message,
    input,
    largeRow,
  ] of queries.messageRows(id, thread.id)) {
    if (
      typeof sequence !== "number" ||
      !Number.isSafeInteger(sequence) ||
      sequence <= previousSequence
    )
      throw new ImportValidationError("conversation");
    previousSequence = sequence;
    if (role !== "assistant" && role !== "user") continue;
    const meta = readFields(raw);
    const recovered =
      thread.recoveredSession !== undefined &&
      meta?.sessionId === thread.recoveredSession;
    const turns = recovered ? recoveredTurns : activeTurns;
    const owner = rowAttribution(
      role,
      meta,
      recovered ? thread.recoveredSession : session,
      message,
      input,
      queries.legacy,
      thread.recoveredSession !== undefined,
    );
    if (!meta || owner !== "public") {
      if (role === "user") {
        turns.user(owner, meta?.requestSetId);
        if (thread.recoveredSession !== undefined && meta?.sessionId == null)
          recoveredTurns.user(owner, meta?.requestSetId);
      }
      omitted ||= owner === "unknown";
      continue;
    }
    if (role === "assistant") {
      const turn = turns.assistant(meta.requestSetId);
      if (turn !== "public") {
        omitted ||= turn === "unknown";
        continue;
      }
    }
    const rawParts =
      largeRow == null ? parts : queries.readLargeParts(largeRow);
    const {
      text,
      omitted: uncertainParts,
      userInput,
      turns: exchanges,
    } = collectQwenWorkParts(rawParts, references, role, meta, queries.legacy);
    omitted ||= uncertainParts;
    if (role === "user")
      turns.user(
        userInput ? "public" : uncertainParts ? "unknown" : "internal",
        meta.requestSetId,
      );
    const timestamp = qwenWorkTimestamp(created);
    for (const exchange of exchanges ?? [{ role, text }]) {
      if (!exchange.text) continue;
      textLength += exchange.text.length;
      if (textLength > MAX_BODY_BYTES || messages.length >= MAX_MESSAGES)
        throw new ImportValidationError("conversation");
      messages.push({ ...exchange, ...(timestamp ? { timestamp } : {}) });
    }
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
    ...(omitted ? { omittedUnattributed: true } : {}),
  };
}
