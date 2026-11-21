import initSqlJs, { type Database } from "sql.js";
import {
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import { prepareLargeQwenWorkParts } from "../qwenWorkLargeParts";
import { collectQwenWorkParts } from "../qwenWorkMessages";

const privateMarker = "never-copy-this-tool-output";
const bigTool = {
  type: "tool-Read",
  input: { command: privateMarker },
  output: { text: privateMarker.repeat(45_000) },
};
const answer = {
  type: "text",
  id: "final",
  state: "done",
  text: "  Public.\n",
};
const questions = [{ question: "Which units?", options: [] }];
const receipt = { questions, answers: { "Which units?": "metres" } };
const ask = {
  type: "tool-AskUserQuestion",
  toolName: "AskUserQuestion",
  toolCallId: "ask",
  state: "output-available",
  input: { questions },
  output: { ...receipt, extra: [true, null] },
  result: receipt,
  parentToolUseId: null,
  autoSelectedRecommended: false,
  toolCallMetadata: { source: "fixture" },
};
const file = { type: "data-file", data: { filePath: "C:/Fixture/notes.pdf" } };
const explicit = {
  status: "completed",
  finalTextId: "final",
  finalTextSource: "explicit",
};

let sqlite: Awaited<ReturnType<typeof initSqlJs>>;
let db: Database;
beforeAll(async () => {
  sqlite = await initSqlJs();
});
beforeEach(() => {
  db = new sqlite.Database();
  db.run(
    "CREATE TABLE messages(id TEXT PRIMARY KEY, message_id TEXT, role TEXT, parts TEXT)",
  );
});
afterEach(() => {
  db.close();
});

function put(parts: unknown, key = "row", role = "assistant") {
  db.run("INSERT INTO messages VALUES (?,?,?,?)", [
    key,
    `sdk-${key}`,
    role,
    JSON.stringify(parts),
  ]);
}

function project(
  raw: string,
  meta: Record<string, unknown> = explicit,
  legacy = false,
) {
  const references = new Set<string>();
  const result = collectQwenWorkParts(
    raw,
    references,
    "assistant",
    meta,
    legacy,
  );
  return { ...result, references: [...references] };
}

describe("bounded QwenWork assistant part reads", () => {
  it("projects by messages.id without transferring tool bodies; leaves the complete bounded clarification after the final", () => {
    const parts = [bigTool, answer, ask];
    put(parts);
    put([answer], "sdk-row");
    put(parts, "user-row", "user");
    db.run("PRAGMA trusted_schema=OFF; PRAGMA query_only=ON");
    const original = db.prepare.bind(db);
    const prepare = vi.spyOn(db, "prepare").mockImplementation((...args) => {
      const statement = original(...args);
      const get = statement.get.bind(statement);
      vi.spyOn(statement, "get").mockImplementation((...params) => {
        const values = get(...params);
        for (const value of values) {
          const transferred =
            value instanceof Uint8Array
              ? new TextDecoder().decode(value)
              : value;
          if (typeof transferred === "string")
            expect(transferred).not.toContain(privateMarker);
        }
        return values;
      });
      return statement;
    });
    const read = prepareLargeQwenWorkParts(db);
    const prepared = prepare.mock.calls.length;
    expect(read("missing")).toBeNull();
    expect(read("user-row")).toBeNull();
    const result = read("row")!;
    expect(JSON.parse(result)).toEqual([{ type: bigTool.type }, answer, ask]);
    expect(project(result)).toEqual(project(JSON.stringify(parts)));
    expect(project(result)).toMatchObject({
      turns: [
        { role: "assistant", text: answer.text },
        { role: "assistant", text: questions[0].question },
        { role: "user", text: "metres" },
      ],
    });
    expect(read("row")).toBe(result);
    expect(prepare.mock.calls.length).toBe(prepared);
  });

  it.each([
    [
      "duplicate on an opaque part",
      [answer, { type: "future-view", id: "final", output: privateMarker }],
      explicit,
    ],
    [
      "duplicate on a nested part",
      [answer, { ...answer, metadata: { parent_agent_id: "child" } }],
      explicit,
    ],
    ["selected sidechain", [{ ...answer, isSidechain: true }], explicit],
    [
      "selected nested metadata",
      [{ ...answer, metadata: { isSynthetic: true } }],
      explicit,
    ],
    [
      "selected plan",
      [{ ...answer, metadata: { planKind: "draft" } }],
      explicit,
    ],
    ["selected draft", [{ ...answer, state: "streaming" }], explicit],
    [
      "namespaced final",
      [{ ...answer, id: "worker:final" }],
      { ...explicit, finalTextId: "worker:final" },
    ],
    [
      "unknown source with tempting text",
      [answer, { type: "unknown", text: privateMarker }],
      { ...explicit, finalTextSource: "unknown" },
    ],
    [
      "client-last-text with hidden tools",
      [answer],
      { ...explicit, finalTextSource: "client-last-text" },
    ],
    ["non-final root text with no selector", [answer], { status: "completed" }],
  ] as const)("preserves rejection of %s", (_name, blocks, meta) => {
    const parts = [bigTool, ...blocks];
    put(parts);
    const raw = prepareLargeQwenWorkParts(db)("row")!;
    expect(raw).not.toContain(privateMarker);
    expect(project(raw, meta)).toEqual(project(JSON.stringify(parts), meta));
    expect(project(raw, meta)).toMatchObject({ text: "", omitted: true });
  });

  it("retains namespaced and child question evidence, not just extracted prompts", () => {
    const hidden = [
      { ...ask, toolCallId: "child:ask", parentToolUseId: undefined },
      { ...ask, metadata: { parent_tool_use_id: "child" } },
      { ...ask, state: "output-error" },
    ];
    put([bigTool, ...hidden, answer]);
    const raw = prepareLargeQwenWorkParts(db)("row")!;
    expect(JSON.parse(raw).slice(1, -1)).toEqual(hidden);
    expect(project(raw).text).toBe(answer.text);
  });

  it.each([
    { type: "child-run", childRun: { id: "child", resultText: privateMarker } },
    { type: "tool-Unknown", toolCallId: "child:ask", output: privateMarker },
  ])(
    "keeps namespace and duplicate-call witnesses even after a question",
    (witness) => {
      const parts = [
        bigTool,
        { ...ask, toolCallId: "child:ask" },
        answer,
        witness,
      ];
      put(parts);
      const raw = prepareLargeQwenWorkParts(db)("row")!;
      expect(raw).not.toContain(privateMarker);
      expect(project(raw)).toEqual(project(JSON.stringify(parts)));
      expect(project(raw)).toMatchObject({ text: answer.text, omitted: true });
    },
  );

  it("preserves attachment constraints and omits file payloads even when the file is eligible", () => {
    const padded = { ...file, data: { ...file.data, content: privateMarker } };
    const mixed = [
      bigTool,
      { ...answer, id: "preface", text: "Earlier" },
      answer,
      padded,
    ];
    put(mixed);
    put([answer, padded], "plain");
    const read = prepareLargeQwenWorkParts(db);
    const raw = read("row")!;
    expect(project(raw)).toEqual(project(JSON.stringify(mixed)));
    expect(project(raw).references).toEqual([]);
    const plain = read("plain")!;
    expect(plain).not.toContain(privateMarker);
    expect(project(plain).references).toEqual([file.data.filePath]);
  });

  it("rejects ambiguous primary-key matches across roles or chats, even when only one is an assistant", () => {
    db.run(
      "DROP TABLE messages; CREATE TABLE messages(id, chat_id, role, parts)",
    );
    db.run(
      "INSERT INTO messages VALUES ('duplicate','other','user','[]'),('duplicate','here','assistant',?)",
      [JSON.stringify([answer])],
    );
    const read = prepareLargeQwenWorkParts(db);
    expect(read("duplicate")).toBeNull();
    db.run("UPDATE messages SET role='assistant' WHERE role='user'");
    expect(read("duplicate")).toBeNull();
  });

  it("does not repair malformed UTF-8 into visible text or treat a binary parts column as JSON text", () => {
    db.run(`INSERT INTO messages VALUES ('row','sdk','assistant',
      CAST('[{"type":"text","id":"final","text":"' || x'ff' || '"}]' AS TEXT)),
      ('blob','second','assistant',CAST('[{"type":"text","text":"Binary"}]' AS BLOB))`);
    const read = prepareLargeQwenWorkParts(db);
    expect(read("row")).toBeNull();
    expect(read("blob")).toBeNull();
  });

  it.each([
    ["non-array JSON", JSON.stringify({ parts: [answer] })],
    ["invalid JSON", '[{"type":"text"},'],
    ["trailing bytes after NUL", JSON.stringify([answer]) + "\0invalid"],
    ["scalar part", JSON.stringify([42, answer])],
    ["missing type", JSON.stringify([{ id: "final", text: "Unknown" }])],
    ["malformed text", JSON.stringify([{ ...answer, text: ["wrong"] }])],
    [
      "duplicate discriminator",
      '[{"type":"tool-Example","\\u0074ype":"text","id":"final","text":"wrong"}]',
    ],
    [
      "duplicate nested marker",
      '[{"type":"text","id":"final","text":"wrong","metadata":{"isMeta":false,"isMeta":true}}]',
    ],
    [
      "conflicting clarification receipt keys",
      '[{"type":"tool-AskUserQuestion","output":{"answers":{"question":"A","question":"B"}}}]',
    ],
    [
      "oversized answer in UTF-8 bytes",
      JSON.stringify([{ ...answer, text: "界".repeat(90_000) }]),
    ],
    [
      "oversized raw question",
      JSON.stringify([
        answer,
        { ...ask, output: { text: "x".repeat(130_000) } },
      ]),
    ],
    [
      "too many parts",
      JSON.stringify([
        answer,
        ...Array.from({ length: 2_048 }, () => ({ type: "tool-Example" })),
      ]),
    ],
    [
      "oversized total projection",
      JSON.stringify(
        Array.from({ length: 24 }, () => ({
          ...answer,
          text: "界".repeat(18_000),
        })),
      ),
    ],
    [
      "oversized source row",
      JSON.stringify([
        { type: "tool-Example", output: "x".repeat(9 * 1024 * 1024) },
        answer,
      ]),
    ],
    [
      "oversized single private part",
      JSON.stringify([
        { type: "tool-Example", output: "x".repeat(4 * 1024 * 1024) },
        answer,
      ]),
    ],
  ])(
    "returns null for %s rather than silently deleting the problem",
    (_name, raw) => {
      db.run("INSERT INTO messages VALUES ('row','sdk','assistant',?)", [raw]);
      const read = prepareLargeQwenWorkParts(db);
      expect(read("row")).toBeNull();
      put([answer], "subsequent");
      expect(read("subsequent")).not.toBeNull();
    },
  );
});
