import initSqlJs, { type Database } from "sql.js";

export function pickedFile(path: string, data: BlobPart = "") {
  const file = new File([data], path.split("/").at(-1)!);
  Object.defineProperty(file, "webkitRelativePath", { value: path });
  return file;
}

async function snapshot(populate: (db: Database) => void) {
  const sqlite = await initSqlJs();
  const db = new sqlite.Database();
  try {
    db.run(`
      CREATE TABLE chats (
        id TEXT PRIMARY KEY, name TEXT, worktree_path TEXT,
        created_at INTEGER, updated_at INTEGER, deleted_at INTEGER
      );
      CREATE TABLE sub_chats (id TEXT PRIMARY KEY, chat_id TEXT, created_at INTEGER);
      CREATE TABLE messages (
        id TEXT PRIMARY KEY, chat_id TEXT, sub_chat_id TEXT, sequence INTEGER,
        role TEXT, parts TEXT, created_at INTEGER
      );
    `);
    populate(db);
    return new Uint8Array(db.export()).buffer;
  } finally {
    db.close();
  }
}

export function makeQwenWorkFixture(update?: (db: Database) => void) {
  return snapshot((db) => {
    db.run(`
      INSERT INTO chats VALUES
        ('source-first', 'Local fixture', 'D:/Project', 1788264000, 1788264010, NULL),
        ('source-second', 'Leave this out', NULL, 1788264000, 1788264000, NULL),
        ('source-deleted', 'Deleted fixture', NULL, 1788264000, 1788264020, 1);
      INSERT INTO sub_chats VALUES
        ('sub-earlier','source-first',1788264000),
        ('sub-other','source-second',1788264000),
        ('sub-deleted','source-deleted',1788264000);
      INSERT INTO messages VALUES
        ('fourth','source-first','sub-earlier',3,'assistant','[{"type":"text","text":"Second sub-chat"}]',NULL),
        ('third','source-first','sub-earlier',2,'assistant','[{"type":"tool-Bash","input":{"command":"PRIVATE TOOL INPUT"}}]',NULL),
        ('second','source-first','sub-earlier',1,'assistant','[{"type":"text","text":"<img src=example>"},{"type":"data-file","data":{"filePath":"D:/Project/output/report.pdf"}}]',1788264001000),
        ('first','source-first','sub-earlier',0,'user','[{"type":"text","text":"A local question"}]',1788264000),
        ('hidden','source-deleted','sub-deleted',0,'user','[{"type":"text","text":"Deleted text"}]',NULL),
        ('other','source-second','sub-other',0,'user','[{"type":"text","text":"Not selected"}]',NULL),
        ('mismatch','source-second','sub-earlier',3,'user','[{"type":"text","text":"Invalid membership"}]',NULL);
    `);
    update?.(db);
  });
}

export function addRecentToolOnlyConversations(db: Database) {
  db.run(`
    WITH RECURSIVE ids(n) AS (VALUES(1) UNION ALL SELECT n+1 FROM ids WHERE n<100)
    INSERT INTO chats SELECT 'tools-'||n,'Tools only',NULL,0,1788264110,NULL FROM ids;
    INSERT INTO sub_chats SELECT 'sub-'||id,id,0 FROM chats WHERE id LIKE 'tools-%';
    INSERT INTO messages SELECT 'msg-'||id,id,'sub-'||id,0,'assistant','[{"type":"tool-example"}]',NULL
      FROM chats WHERE id LIKE 'tools-%';
  `);
}

export function makeProjectedFixture(populate: (db: Database) => void) {
  return snapshot((db) => {
    db.run(`
      ALTER TABLE chats ADD COLUMN source_chat_id TEXT;
      ALTER TABLE chats ADD COLUMN ext TEXT;
      ALTER TABLE sub_chats ADD COLUMN name TEXT;
      ALTER TABLE sub_chats ADD COLUMN session_id TEXT;
      ALTER TABLE messages ADD COLUMN metadata TEXT;
      ALTER TABLE messages ADD COLUMN message_id TEXT;
      CREATE TABLE agent_turn_inputs (chat_id TEXT, sub_chat_id TEXT, message_id TEXT, source TEXT, state TEXT);
      CREATE TABLE task_run_logs (chat_id TEXT);
    `);
    populate(db);
  });
}

export function addChat(
  db: Database,
  chat: string,
  subs: string[],
  ext: object = {},
  parent: string | null = null,
) {
  db.run("INSERT INTO chats (id,name,ext,source_chat_id) VALUES (?,?,?,?)", [
    chat,
    chat,
    JSON.stringify(ext),
    parent,
  ]);
  for (const [index, sub] of subs.entries()) {
    db.run("INSERT INTO sub_chats VALUES (?,?,?,?,?)", [
      sub,
      chat,
      index,
      "Same display name",
      `session-${sub}`,
    ]);
  }
}

export function addRow(
  db: Database,
  chat: string,
  sub: string,
  sequence: number,
  role: "assistant" | "user",
  parts: object[],
  metadata: object = {},
  inputSource?: string,
) {
  const key = `${sub}-${sequence}`;
  db.run("INSERT INTO messages VALUES (?,?,?,?,?,?,?,?,?)", [
    `row-${key}`,
    chat,
    sub,
    sequence,
    role,
    JSON.stringify(parts),
    100 - sequence,
    JSON.stringify({
      source: "sdk-projection",
      sessionId: `session-${sub}`,
      ...metadata,
    }),
    `message-${key}`,
  ]);
  if (inputSource) {
    db.run("INSERT INTO agent_turn_inputs VALUES (?,?,?,?,?)", [
      chat,
      sub,
      `message-${key}`,
      inputSource,
      "consumed",
    ]);
  }
}
