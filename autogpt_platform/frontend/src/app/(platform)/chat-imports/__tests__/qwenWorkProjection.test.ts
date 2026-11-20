import { describe, expect, it } from "vitest";
import { readQwenWorkDatabase } from "../qwenWorkDatabase";
import { addChat, addRow, makeProjectedFixture } from "./qwenWorkFixture";

function text(value: string, id?: string) {
  return { type: "text", text: value, id };
}

function final(id: string) {
  return { status: "completed", resultSubtype: "success", finalTextId: id };
}

describe("QwenWork public transcript", () => {
  it.each([{}, { activeLegokitId: "fixture-specialist" }])(
    "keeps the user-facing turns regardless of the selected expert: %j",
    async (ext) => {
      const raw = await makeProjectedFixture((db) => {
        addChat(db, "conversation", ["dialog"], ext);
        addRow(
          db,
          "conversation",
          "dialog",
          4,
          "assistant",
          [
            text("Unpublished", "prelude"),
            { type: "tool-example", input: { text: "Tool input" } },
            text("  A square.\n", "reply"),
          ],
          final("reply"),
        );
        addRow(
          db,
          "conversation",
          "dialog",
          1,
          "user",
          [text("What shape?")],
          {},
          "desktop",
        );
        addRow(
          db,
          "conversation",
          "dialog",
          3,
          "user",
          [text("In two dimensions.")],
          { sdkUserMessageUuid: "fixture-followup" },
        );
        addRow(
          db,
          "conversation",
          "dialog",
          2,
          "assistant",
          [text("How many dimensions?", "clarify")],
          final("clarify"),
        );
      });
      const { entries, skipped } = await readQwenWorkDatabase(raw);
      expect(skipped).toBe(0);
      expect(entries).toHaveLength(1);
      expect(entries[0]).not.toHaveProperty("omittedUnattributed");
      expect(
        entries[0].conversation.messages.map(({ role, text }) => [role, text]),
      ).toEqual([
        ["user", "What shape?"],
        ["assistant", "How many dimensions?"],
        ["user", "In two dimensions."],
        ["assistant", "  A square.\n"],
      ]);
    },
  );

  it("uses the uniquely user-addressed thread, not the first sibling, and never imports execution chats", async () => {
    const raw = await makeProjectedFixture((db) => {
      addChat(db, "team", ["first", "public", "third"]);
      for (const sub of ["first", "third"]) {
        addRow(db, "team", sub, 0, "user", [text("A delegated question")], {
          sdkUserMessageUuid: "looks-like-a-user",
        });
        addRow(
          db,
          "team",
          sub,
          1,
          "assistant",
          [text("A sibling result", "result")],
          final("result"),
        );
      }
      addRow(
        db,
        "team",
        "public",
        0,
        "user",
        [text("Compare both shapes")],
        {},
        "desktop",
      );
      addRow(
        db,
        "team",
        "public",
        1,
        "assistant",
        [text("Root summary", "result")],
        final("result"),
      );
      for (const child of ["linked", "app-owned", "scheduled", "log-owned"]) {
        addChat(
          db,
          child,
          [child],
          child === "app-owned"
            ? { agentExecutionOwner: { appId: "fixture-owner" } }
            : { isCronChat: child === "scheduled" },
          child === "linked" ? "team" : null,
        );
        addRow(
          db,
          child,
          child,
          0,
          "user",
          [text("Internal assignment")],
          {},
          "desktop",
        );
      }
      db.run("INSERT INTO task_run_logs VALUES ('log-owned')");
    });
    const { entries, skipped } = await readQwenWorkDatabase(raw);
    expect(skipped).toBe(4);
    expect(entries).toHaveLength(1);
    expect(entries[0]).toMatchObject({
      omittedUnattributed: true,
      conversation: { title: "team" },
    });
    expect(entries[0].conversation.messages.map(({ text }) => text)).toEqual([
      "Compare both shapes",
      "Root summary",
    ]);
  });

  it("does not infer ownership from an SDK UUID, an input on another chat, or two user-addressed siblings", async () => {
    const raw = await makeProjectedFixture((db) => {
      for (const chat of ["no-anchor", "two-anchors"]) {
        const subs = [`${chat}-one`, `${chat}-two`];
        addChat(db, chat, subs, { activeLegokitId: subs[0] });
        for (const sub of subs) {
          addRow(
            db,
            chat,
            sub,
            0,
            "user",
            [text("Looks genuine")],
            { sdkUserMessageUuid: "present" },
            chat === "two-anchors" ? "desktop" : undefined,
          );
        }
      }
      db.run(
        "INSERT INTO agent_turn_inputs VALUES ('unrelated','no-anchor-one','message-no-anchor-one-0','desktop','consumed')",
      );
    });
    expect(await readQwenWorkDatabase(raw)).toMatchObject({
      entries: [],
      skipped: 2,
    });
  });

  it("keeps root clarifications, never tool results, sidechain text, or replies to injected turns", async () => {
    const raw = await makeProjectedFixture((db) => {
      const question = {
        type: "tool-AskUserQuestion",
        toolName: "AskUserQuestion",
        toolCallId: "ask",
        state: "output-available",
        input: {
          questions: [
            { question: "Which units?", options: ["Secret suggestion"] },
          ],
        },
        output: { text: "Never a user message" },
      };
      addChat(db, "interactive", ["root"]);
      addRow(
        db,
        "interactive",
        "root",
        0,
        "user",
        [text("Measure it")],
        {},
        "desktop",
      );
      addRow(
        db,
        "interactive",
        "root",
        1,
        "assistant",
        [
          {
            ...question,
            toolCallId: "worker:ask",
            parentToolUseId: "worker",
            input: { questions: [{ question: "Internal question" }] },
          },
          question,
          text("The value is three", "end"),
        ],
        final("end"),
      );
      addRow(db, "interactive", "root", 2, "user", [text("Notification")], {
        isSystemNotification: true,
      });
      addRow(
        db,
        "interactive",
        "root",
        3,
        "assistant",
        [text("Reply to notification", "end")],
        final("end"),
      );
      addRow(db, "interactive", "root", 4, "user", [text("In centimetres")], {
        sdkUserMessageUuid: "manual",
      });
      addRow(db, "interactive", "root", 5, "user", [text("Sidechain input")], {
        isSidechain: true,
      });
      addRow(
        db,
        "interactive",
        "root",
        6,
        "assistant",
        [text("A draft", "end")],
        { status: "streaming", finalTextId: "end" },
      );
      addRow(
        db,
        "interactive",
        "root",
        7,
        "assistant",
        [text("3 cm", "end")],
        final("end"),
      );
    });
    const { entries } = await readQwenWorkDatabase(raw);
    expect(entries[0].conversation.messages.map(({ text }) => text)).toEqual([
      "Measure it",
      "Which units?\nThe value is three",
      "In centimetres",
      "3 cm",
    ]);
  });

  it("warns on unknown ownership or mismatched finals without falling back to another part or file", async () => {
    const raw = await makeProjectedFixture((db) => {
      const ref = {
        type: "data-file",
        data: { filePath: "D:/Fixture/unattributed.txt" },
      };
      addChat(db, "uncertain", ["root"]);
      addRow(
        db,
        "uncertain",
        "root",
        0,
        "user",
        [text("Known")],
        {},
        "desktop",
      );
      addRow(
        db,
        "uncertain",
        "root",
        1,
        "assistant",
        [text("Not selected", "other"), ref],
        final("missing"),
      );
      addRow(
        db,
        "uncertain",
        "root",
        2,
        "assistant",
        [text("One", "dup"), text("Two", "dup")],
        final("dup"),
      );
      addRow(
        db,
        "uncertain",
        "root",
        3,
        "assistant",
        [text("Other session", "id")],
        { ...final("id"), sessionId: "not-root" },
      );
      addRow(db, "uncertain", "root", 4, "user", [text("Unknown owner"), ref]);
      addRow(
        db,
        "uncertain",
        "root",
        5,
        "assistant",
        [text("Unknown reply", "id")],
        final("id"),
      );
      addRow(
        db,
        "uncertain",
        "root",
        6,
        "user",
        [text("Known again")],
        {},
        "desktop",
      );
      addRow(
        db,
        "uncertain",
        "root",
        7,
        "assistant",
        [text("Done", "id")],
        final("id"),
      );
    });
    const { entries } = await readQwenWorkDatabase(raw);
    expect(entries[0]).toMatchObject({
      omittedUnattributed: true,
      references: [],
    });
    expect(entries[0].conversation.messages.map(({ text }) => text)).toEqual([
      "Known",
      "Known again",
      "Done",
    ]);
  });

  it("warns on an orphan reply, but preserves replies to a genuine attachment-only input", async () => {
    const raw = await makeProjectedFixture((db) => {
      addChat(db, "mixed", ["root"]);
      addRow(
        db,
        "mixed",
        "root",
        0,
        "assistant",
        [text("Orphan", "id")],
        final("id"),
      );
      addRow(
        db,
        "mixed",
        "root",
        1,
        "user",
        [{ type: "data-file", data: { filePath: "D:/Fixture/drawing.svg" } }],
        {},
        "desktop",
      );
      addRow(
        db,
        "mixed",
        "root",
        2,
        "assistant",
        [text("A drawing", "id")],
        final("id"),
      );
      addRow(db, "mixed", "root", 3, "user", [text("Thanks")], {}, "desktop");
    });
    const { entries } = await readQwenWorkDatabase(raw);
    expect(entries[0]).toMatchObject({ omittedUnattributed: true });
    expect(entries[0].conversation.messages.map(({ text }) => text)).toEqual([
      "A drawing",
      "Thanks",
    ]);
  });

  it("does not assign a late internal reply or a draft input to the latest public question", async () => {
    const raw = await makeProjectedFixture((db) => {
      addChat(db, "interleaved", ["root"]);
      const row = addRow.bind(null, db, "interleaved", "root");
      row(0, "user", [text("A notification")], {
        isSystemNotification: true,
        requestSetId: "internal",
      });
      row(
        1,
        "user",
        [text("Real question")],
        { requestSetId: "public" },
        "desktop",
      );
      row(2, "assistant", [text("Late internal result", "end")], {
        ...final("end"),
        requestSetId: "internal",
      });
      row(3, "user", [text("Never submitted")], {
        sdkUserMessageUuid: "draft-input",
        status: "draft",
      });
      row(4, "assistant", [text("Real reply", "end")], {
        ...final("end"),
        requestSetId: "public",
      });
      row(
        5,
        "user",
        [text("Next question")],
        { requestSetId: "next" },
        "desktop",
      );
      row(6, "assistant", [text("Unrelated reply", "end")], {
        ...final("end"),
        requestSetId: "unmatched",
      });
    });
    const { entries } = await readQwenWorkDatabase(raw);
    expect(entries[0]).toMatchObject({ omittedUnattributed: true });
    expect(entries[0].conversation.messages.map(({ text }) => text)).toEqual([
      "Real question",
      "Real reply",
      "Next question",
    ]);
  });
});
