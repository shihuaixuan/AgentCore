import { describe, expect, it } from "vitest";
import {
  openQwenWorkDatabase,
  readQwenWorkDatabase,
} from "../qwenWorkDatabase";
import {
  addRecentToolOnlyConversations,
  makeQwenWorkFixture,
} from "./qwenWorkFixture";

describe("QwenWork snapshot reader", () => {
  it("counts the same candidates that it pages, including an entirely skipped page", async () => {
    const raw = await makeQwenWorkFixture((db) => {
      addRecentToolOnlyConversations(db);
      db.run(`
        INSERT INTO chats VALUES
          ('bad-join','Wrong sub-chat',NULL,0,1788264120,NULL),
          ('wrong-role','Tool role',NULL,0,1788264120,NULL),
          ('','Invalid ID',NULL,0,1788264120,NULL);
        INSERT INTO sub_chats VALUES ('wrong-role-sub','wrong-role',0),('empty-id-sub','',0);
        INSERT INTO messages VALUES
          ('wrong-join-msg','bad-join','sub-other',0,'user','[]',0),
          ('wrong-role-msg','wrong-role','wrong-role-sub',0,'tool','[]',0),
          ('empty-id-msg','','empty-id-sub',0,'user','[]',0);
      `);
    });
    const reader = await openQwenWorkDatabase(raw);
    try {
      const manualPage = await readQwenWorkDatabase(raw, 1);
      new Uint8Array(raw).fill(0);
      expect(reader.total).toBe(102);
      expect(reader.readPage(0)).toEqual({
        entries: [],
        skipped: 100,
        page: 0,
        hasOlder: true,
      });
      const older = reader.readPage(1);
      expect(older).toMatchObject({ skipped: 0, page: 1, hasOlder: false });
      expect(
        older.entries.map(({ conversation }) => conversation.title),
      ).toEqual(["Local fixture", "Leave this out"]);
      expect(older).toEqual(manualPage);
      expect(reader.readPage(2)).toEqual({
        entries: [],
        skipped: 0,
        page: 2,
        hasOlder: false,
      });
      expect(reader.readPage(1)).toEqual(older);
    } finally {
      reader.close();
      reader.close();
    }
    expect(() => reader.readPage(0)).toThrow("qwenwork-reader");
  });

  it("cleans only marked user parts and skips a reminder-only conversation", async () => {
    const question = "  Inline `<system-prompt>literal</system-prompt>`\n";
    const answer = "<user_query>Assistant's literal wrapper</user_query>";
    const reminder = "<system-reminder>CONTEXT</system-reminder>";
    function parts(...blocks: string[]) {
      return JSON.stringify(blocks.map((text) => ({ type: "text", text })));
    }
    const raw = await makeQwenWorkFixture((db) => {
      db.run("ALTER TABLE messages ADD COLUMN searchable_text TEXT");
      db.run(
        "UPDATE messages SET parts=?, searchable_text=? WHERE id='first'",
        [
          parts(`${reminder}\n<user_query>${question}</user_query>`, reminder),
          "Do not substitute searchable_text",
        ],
      );
      db.run("UPDATE messages SET parts=? WHERE id='second'", [parts(answer)]);
      db.run("UPDATE messages SET parts=? WHERE id='other'", [parts(reminder)]);
    });
    const { entries, skipped } = await readQwenWorkDatabase(raw);
    expect(skipped).toBe(1);
    expect(entries).toHaveLength(1);
    expect(entries[0].conversation.messages.map(({ text }) => text)).toEqual([
      question,
      answer,
      "Second sub-chat",
    ]);
  });

  it("verifies the real SQLite schema even if it has a table named like the pragma", async () => {
    const raw = await makeQwenWorkFixture((db) => {
      db.run(`
        ALTER TABLE messages RENAME TO source_messages;
        CREATE VIEW messages AS SELECT * FROM source_messages;
        CREATE TABLE pragma_table_list(schema, type, name);
        INSERT INTO pragma_table_list VALUES
          ('main','table','chats'), ('main','table','sub_chats'), ('main','table','messages');
      `);
    });
    await expect(
      openQwenWorkDatabase(raw).then((reader) => reader.close()),
    ).rejects.toThrow("qwenwork-database");
  });
});
