import { describe, expect, it } from "vitest";
import {
  encodeImport,
  makeQianwenConversation,
  parseWorkBuddyBundle,
} from "../validation";

const conversation = {
  source: "workbuddy" as const,
  source_id: "a".repeat(64),
  title: "工作笔记",
  messages: [
    { role: "user" as const, text: "  第一行\n第二行  ", timestamp: null },
    {
      role: "assistant" as const,
      text: "<b>Literal</b>",
      timestamp: "2026-01-01T10:00:00+08:00",
    },
  ],
};

function parse(...conversations: unknown[]) {
  return parseWorkBuddyBundle(JSON.stringify({ version: 1, conversations }));
}

describe("WorkBuddy bundle validation", () => {
  it("preserves turn order and text while dropping fields outside the contract", () => {
    const result = parse({ ...conversation, extra: "not sent" });
    expect(result).toEqual([conversation]);
  });

  it.each([
    ["wrong source", { ...conversation, source: "qianwen" }],
    ["missing ID", { ...conversation, source_id: undefined }],
    ["blank ID", { ...conversation, source_id: " " }],
    ["malformed ID", { ...conversation, source_id: "A".repeat(64) }],
    ["blank title", { ...conversation, title: " " }],
    ["long title", { ...conversation, title: "🙂".repeat(201) }],
    ["NUL in title", { ...conversation, title: "broken\0title" }],
    ["lone surrogate in title", { ...conversation, title: "broken\udfff" }],
    ["no turns", { ...conversation, messages: [] }],
    [
      "too many turns",
      { ...conversation, messages: Array(501).fill(conversation.messages[0]) },
    ],
    [
      "unknown role",
      { ...conversation, messages: [{ role: "tool", text: "tool call" }] },
    ],
    [
      "long text",
      {
        ...conversation,
        messages: [{ role: "user", text: "字".repeat(100001) }],
      },
    ],
    [
      "invalid timestamp",
      {
        ...conversation,
        messages: [
          { role: "user", text: "hi", timestamp: "2026-02-30T10:00:00Z" },
        ],
      },
    ],
    [
      "timestamp without a timezone",
      {
        ...conversation,
        messages: [
          { role: "user", text: "hi", timestamp: "2026-01-01T10:00:00" },
        ],
      },
    ],
  ])("rejects %s and identifies the bad entry", (_label, invalid) => {
    expect(() => parse(conversation, invalid)).toThrow(
      expect.objectContaining({ code: "conversation", entry: 2 }),
    );
  });

  it("rejects invalid JSON and unsupported versions", () => {
    expect(() => parseWorkBuddyBundle("{")).toThrow(
      expect.objectContaining({ code: "json" }),
    );
    expect(() =>
      parseWorkBuddyBundle('{"version":2,"conversations":[]}'),
    ).toThrow(expect.objectContaining({ code: "bundle" }));
  });
});

describe("import request validation", () => {
  it("requires a title, question and answer and preserves the pasted text", () => {
    expect(() =>
      makeQianwenConversation("Title", [{ question: "Question", answer: " " }]),
    ).toThrow();
    expect(
      makeQianwenConversation("Title", [
        { question: "Question", answer: "\n Answer 🙂" },
      ]),
    ).toEqual({
      source: "qianwen",
      title: "Title",
      messages: [
        { role: "user", text: "Question" },
        { role: "assistant", text: "\n Answer 🙂" },
      ],
    });
  });

  it.each(["contains\0NUL", "lone high \ud800", "lone low \udc00"])(
    "rejects invalid message text",
    (text) => {
      expect(() =>
        makeQianwenConversation("Title", [
          { question: "Question", answer: text },
        ]),
      ).toThrow(expect.objectContaining({ code: "manual" }));
      expect(() =>
        parse({ ...conversation, messages: [{ role: "user", text }] }),
      ).toThrow(expect.objectContaining({ code: "conversation", entry: 1 }));
    },
  );

  it("accepts exactly 25 entries from a bundle that contains more", () => {
    const bundle = parse(...Array(26).fill(conversation));
    expect(() => encodeImport([])).toThrow(
      expect.objectContaining({ code: "selection" }),
    );
    expect(JSON.parse(encodeImport(bundle.slice(0, 25)))).toEqual({
      conversations: bundle.slice(0, 25),
    });
    expect(() => encodeImport(bundle)).toThrow(
      expect.objectContaining({ code: "selection" }),
    );
  });

  it("enforces 4 MiB on the UTF-8 serialized body, not on the text or file length", () => {
    const large = {
      ...conversation,
      messages: Array(14).fill({
        role: "assistant",
        text: "字".repeat(100000),
      }),
    };
    expect(() => encodeImport([large])).toThrow(
      expect.objectContaining({ code: "size" }),
    );
    expect(() =>
      encodeImport([{ ...large, messages: large.messages.slice(1) }]),
    ).not.toThrow();
  });
});
