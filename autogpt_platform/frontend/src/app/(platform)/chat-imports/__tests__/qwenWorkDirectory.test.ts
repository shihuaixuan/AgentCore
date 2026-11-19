import { createHash } from "node:crypto";
import { afterEach, describe, expect, it, vi } from "vitest";
import { readQwenWorkDatabase } from "../qwenWorkDatabase";
import { findQwenWorkDatabase } from "../qwenWorkDirectory";
import { makeQwenWorkFixture, pickedFile } from "./qwenWorkFixture";

afterEach(() => vi.unstubAllGlobals());

describe("QwenWork directory import", () => {
  it("recognizes only the immediate data directory or the app root", () => {
    const db = pickedFile("QwenWorkCN/data/agents.db", "database");
    const unrelated = pickedFile("QwenWorkCN/cache/agents.db");
    expect(findQwenWorkDatabase([unrelated, db])).toBe(db);
    const dataDB = pickedFile("data/agents.db", "database");
    expect(findQwenWorkDatabase([dataDB])).toBe(dataDB);
    expect(() => findQwenWorkDatabase([unrelated])).toThrow("qwenwork-folder");
    expect(() =>
      findQwenWorkDatabase([db, pickedFile("QwenWorkCN/agents.db")]),
    ).toThrow("qwenwork-folder");
  });

  it.each(["-wal", "-journal", "-WAL"])(
    "rejects a nonempty %s instead of omitting pending changes",
    (suffix) => {
      const db = pickedFile("QwenWorkCN/data/agents.db", "database");
      const journal = pickedFile(
        `QwenWorkCN/data/agents.db${suffix}`,
        "pending data",
      );
      expect(() => findQwenWorkDatabase([db, journal])).toThrow(
        "qwenwork-busy",
      );
    },
  );

  it("projects text and attachment references with legacy IDs without Web Crypto", async () => {
    vi.stubGlobal("crypto", {});
    const raw = await makeQwenWorkFixture();
    const { entries, skipped } = await readQwenWorkDatabase(raw);
    expect(skipped).toBe(0);
    expect(entries.map(({ conversation }) => conversation.title)).toEqual([
      "Local fixture",
      "Leave this out",
    ]);
    expect(entries[0]).toEqual({
      cwd: "D:/Project",
      references: [{ path: "D:/Project/output/report.pdf", cwd: "D:/Project" }],
      conversation: {
        source: "qwenwork",
        source_id: createHash("sha256")
          .update("qwenwork-db-v1\0source-first", "utf8")
          .digest("hex"),
        title: "Local fixture",
        messages: [
          {
            role: "user",
            text: "A local question",
            timestamp: "2026-09-01T12:00:00.000Z",
          },
          {
            role: "assistant",
            text: "<img src=example>",
            timestamp: "2026-09-01T12:00:01.000Z",
          },
          { role: "assistant", text: "Second sub-chat" },
        ],
      },
    });
    expect(JSON.stringify(entries)).not.toMatch(
      /PRIVATE TOOL INPUT|Deleted text|Invalid membership|source-first/,
    );
    expect(
      (await readQwenWorkDatabase(raw)).entries[0].conversation.source_id,
    ).toBe(entries[0].conversation.source_id);
  });

  it("reads a checkpointed WAL-mode database and rejects a non-QwenWork SQLite schema", async () => {
    const raw = await makeQwenWorkFixture();
    new Uint8Array(raw).set([2, 2], 18);
    expect((await readQwenWorkDatabase(raw)).entries).toHaveLength(2);
    const wrong = await makeQwenWorkFixture((db) =>
      db.run("DROP TABLE messages"),
    );
    await expect(readQwenWorkDatabase(wrong)).rejects.toThrow(
      "qwenwork-database",
    );
  });

  it("keeps valid text even if unrelated attachment fields are null", async () => {
    const raw = await makeQwenWorkFixture((db) => {
      db.run("UPDATE messages SET parts=? WHERE id='first'", [
        JSON.stringify([
          {
            type: "text",
            text: "Keep this question",
            data: null,
            filePath: null,
          },
        ]),
      ]);
    });
    expect(
      (await readQwenWorkDatabase(raw)).entries[0].conversation.messages[0],
    ).toMatchObject({
      role: "user",
      text: "Keep this question",
    });
  });

  it("rejects a malformed text part without saving a partial conversation", async () => {
    const raw = await makeQwenWorkFixture((db) => {
      db.run("UPDATE messages SET parts=? WHERE id='first'", [
        '[{"type":"text","text":1}]',
      ]);
    });
    const result = await readQwenWorkDatabase(raw);
    expect(result.skipped).toBe(1);
    expect(
      result.entries.map(({ conversation }) => conversation.title),
    ).toEqual(["Leave this out"]);
  });

  it("skips an oversized conversation instead of importing it partially", async () => {
    const raw = await makeQwenWorkFixture((db) => {
      db.run("UPDATE messages SET parts=? WHERE id='first'", [
        JSON.stringify([{ type: "text", text: "x".repeat(100_001) }]),
      ]);
    });
    const result = await readQwenWorkDatabase(raw);
    expect(result.skipped).toBe(1);
    expect(
      result.entries.map(({ conversation }) => conversation.title),
    ).toEqual(["Leave this out"]);
  });
});
