import initSqlJs, { type Database } from "sql.js";

export function pickedFile(path: string, data: BlobPart = "") {
  const file = new File([data], path.split("/").at(-1)!);
  Object.defineProperty(file, "webkitRelativePath", { value: path });
  return file;
}

export async function makeQwenWorkFixture(update?: (db: Database) => void) {
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
      INSERT INTO chats VALUES
        ('source-first', 'Local fixture', 'D:/Project', 1788264000, 1788264010, NULL),
        ('source-second', 'Leave this out', NULL, 1788264000, 1788264000, NULL),
        ('source-deleted', 'Deleted fixture', NULL, 1788264000, 1788264020, 1);
      INSERT INTO sub_chats VALUES
        ('sub-later','source-first',1788264001),
        ('sub-earlier','source-first',1788264000),
        ('sub-other','source-second',1788264000),
        ('sub-deleted','source-deleted',1788264000);
      INSERT INTO messages VALUES
        ('fourth','source-first','sub-later',0,'assistant','[{"type":"text","text":"Second sub-chat"}]',NULL),
        ('third','source-first','sub-earlier',2,'assistant','[{"type":"tool-Bash","input":{"command":"PRIVATE TOOL INPUT"}}]',NULL),
        ('second','source-first','sub-earlier',1,'assistant','[{"type":"text","text":"<img src=example>"},{"type":"data-file","data":{"filePath":"D:/Project/output/report.pdf"}}]',1788264001000),
        ('first','source-first','sub-earlier',0,'user','[{"type":"text","text":"A local question"}]',1788264000),
        ('hidden','source-deleted','sub-deleted',0,'user','[{"type":"text","text":"Deleted text"}]',NULL),
        ('other','source-second','sub-other',0,'user','[{"type":"text","text":"Not selected"}]',NULL),
        ('mismatch','source-second','sub-earlier',3,'user','[{"type":"text","text":"Invalid membership"}]',NULL);
    `);
    update?.(db);
    return new Uint8Array(db.export()).buffer;
  } finally {
    db.close();
  }
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
