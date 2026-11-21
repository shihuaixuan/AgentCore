import type { Database } from "sql.js";
import { describe, expect, it } from "vitest";
import { readQwenWorkDatabase } from "../qwenWorkDatabase";
import { addChat, addRow, makeProjectedFixture } from "./qwenWorkFixture";

const recovered = {
  boundedTranscriptRecovery: true,
  continuationMode: "bounded-projection",
};
const original = "session-before-recovery";
const question = "Which material?";
const reply = "Use glass.";

function setupTask(db: Database) {
  addChat(db, "task", ["restored"]);
  db.run(
    "ALTER TABLE chats ADD COLUMN chat_type TEXT; ALTER TABLE sub_chats ADD COLUMN ext TEXT;",
  );
  db.run("UPDATE chats SET chat_type='task'");
  db.run("UPDATE sub_chats SET ext=?", [
    JSON.stringify({ taskImport: recovered }),
  ]);
}

function populate(db: Database, huge = false) {
  setupTask(db);
  addRow(
    db,
    "task",
    "restored",
    0,
    "user",
    [{ type: "text", text: question }],
    { sessionId: original, sdkUserMessageUuid: "actual-input" },
  );
  addRow(
    db,
    "task",
    "restored",
    1,
    "assistant",
    [
      {
        type: "tool-other",
        output: { text: huge ? "private log".repeat(130_000) : "private log" },
      },
      { type: "text", id: "private", text: "Unpublished draft" },
      { type: "text", id: "public", text: reply },
    ],
    {
      sessionId: original,
      assistantMessageId: "message-restored-1",
      finalTextId: "public",
      finalTextSource: "explicit",
      status: "completed",
    },
  );
}

describe("QwenWork bounded task recovery", () => {
  it.each([false, true])(
    "keeps the coherently relocated main dialogue (oversized private log: %s)",
    async (huge) => {
      const raw = await makeProjectedFixture((db) => populate(db, huge));
      const { entries, skipped } = await readQwenWorkDatabase(raw);
      expect(skipped).toBe(0);
      expect(entries).toHaveLength(1);
      expect(
        entries[0].conversation.messages.map(({ role, text }) => [role, text]),
      ).toEqual([
        ["user", question],
        ["assistant", reply],
      ]);
      expect(entries[0]).not.toHaveProperty("omittedUnattributed");
    },
  );

  it.each([
    ["ordinary chat", "UPDATE chats SET chat_type='other'"],
    ["unmarked import", "UPDATE sub_chats SET ext='{}'"],
    [
      "other import mode",
      `UPDATE sub_chats SET ext='{"taskImport":{"boundedTranscriptRecovery":true,"continuationMode":"unknown"}}'`,
    ],
    [
      "mixed original sessions",
      `UPDATE messages SET metadata=json_set(metadata,'$.sessionId','foreign') WHERE role='assistant'`,
    ],
    [
      "foreign message ID",
      `UPDATE messages SET metadata=json_set(metadata,'$.assistantMessageId','foreign') WHERE role='assistant'`,
    ],
    [
      "unproven user",
      `UPDATE messages SET metadata=json_remove(metadata,'$.sdkUserMessageUuid') WHERE role='user'`,
    ],
    [
      "only a worker confirms the session",
      `UPDATE messages SET metadata=json_set(metadata,'$.parentToolUseId','delegation') WHERE role='assistant'`,
    ],
    [
      "sibling history",
      "INSERT INTO sub_chats (id,chat_id,session_id) VALUES ('sibling','task','sibling-session')",
    ],
    [
      "original still bound elsewhere",
      `INSERT INTO sub_chats (id,chat_id,session_id) VALUES ('other-sub','other','${original}')`,
    ],
  ])("does not relax ownership for %s", async (_name, change) => {
    const raw = await makeProjectedFixture((db) => {
      populate(db);
      db.run(change);
    });
    expect(await readQwenWorkDatabase(raw)).toMatchObject({
      entries: [],
      skipped: 1,
    });
  });

  it("does not attach an orphan reply from the live session to a recovered turn", async () => {
    const raw = await makeProjectedFixture((db) => {
      populate(db);
      addRow(
        db,
        "task",
        "restored",
        2,
        "assistant",
        [
          {
            type: "text",
            id: "orphan",
            text: "Not a reply to the old question",
          },
        ],
        { status: "completed", finalTextId: "orphan" },
      );
      addRow(
        db,
        "task",
        "restored",
        3,
        "user",
        [{ type: "text", text: "How thick?" }],
        {},
        "desktop",
      );
      addRow(
        db,
        "task",
        "restored",
        4,
        "assistant",
        [{ type: "text", id: "answer", text: "Three millimetres." }],
        { status: "completed", finalTextId: "answer" },
      );
      addRow(
        db,
        "task",
        "restored",
        5,
        "assistant",
        [{ type: "text", id: "unassigned", text: "Unknown session" }],
        { status: "completed", finalTextId: "unassigned", sessionId: null },
      );
    });
    const { entries } = await readQwenWorkDatabase(raw);
    expect(entries[0].omittedUnattributed).toBe(true);
    expect(entries[0].conversation.messages.map(({ text }) => text)).toEqual([
      question,
      reply,
      "How thick?",
      "Three millimetres.",
    ]);
  });

  it.each([false, true])(
    "keeps submitted clarification choices in the user role, even with large tool output: %s",
    async (huge) => {
      const questions = [
        { question: "Which size?", options: [{ label: "Small" }] },
        { question: "Which color?", options: [{ label: "Blue" }] },
      ];
      const receipt = {
        questions,
        answers: { "Which color?": "Blue", "Which size?": "Small" },
      };
      const ask = {
        type: "tool-AskUserQuestion",
        toolName: "AskUserQuestion",
        toolCallId: "call:main:ask",
        parentToolUseId: null,
        state: "output-available",
        autoSelectedRecommended: false,
        input: { questions },
        result: receipt,
        output: receipt,
      };
      const raw = await makeProjectedFixture((db) => {
        populate(db);
        const blocks = [
          {
            type: "tool-unrelated",
            output: huge ? "PRIVATE LOG".repeat(120_000) : "PRIVATE LOG",
          },
          ask,
          {
            type: "tool-AskUserQuestion",
            parentToolUseId: "child",
            toolCallId: "child:ask",
            input: { questions: [{ question: "INTERNAL QUESTION" }] },
          },
          { type: "text", id: "public", text: reply },
        ];
        db.run("UPDATE messages SET parts=? WHERE role='assistant'", [
          JSON.stringify(blocks),
        ]);
      });
      const { entries, skipped } = await readQwenWorkDatabase(raw);
      expect(skipped).toBe(0);
      expect(
        entries[0].conversation.messages.map(({ role, text }) => [role, text]),
      ).toEqual([
        ["user", question],
        ["assistant", "Which size?\nWhich color?"],
        ["user", "Small\nBlue"],
        ["assistant", reply],
      ]);
    },
  );
});
