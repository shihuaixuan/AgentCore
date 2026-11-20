import { createHash } from "node:crypto";
import { describe, expect, it, vi } from "vitest";
import {
  parseWorkBuddyTranscript,
  readWorkBuddyFiles,
} from "../workbuddyTranscript";

const sessionID = "cb2b2f1c-8a2d-4f18-8c42-f96c12df6830";
const question = {
  sessionId: sessionID,
  id: "question",
  type: "message",
  role: "user",
  timestamp: "2026-11-19T08:00:00+08:00",
  content: [
    { type: "input_text", text: "第一问" },
    { type: "image", source: "not imported" },
  ],
};
const answer = {
  ...question,
  id: "answer",
  role: "assistant",
  timestamp: 1795046400000,
  content: [{ type: "output_text", text: "第一答" }],
};

function jsonl(...records: unknown[]) {
  return records.map((record) => JSON.stringify(record)).join("\r\n");
}

describe("native WorkBuddy files", () => {
  it("preserves the session title, text order, and legacy ID without Web Crypto", () => {
    vi.stubGlobal("crypto", {});
    try {
      const transcript = parseWorkBuddyTranscript(
        "\ufeff" +
          jsonl(
            { type: "session_start", sessionId: sessionID },
            question,
            {
              type: "reasoning",
              sessionId: sessionID,
              content: "not imported",
            },
            { type: "ai-title", sessionId: sessionID, aiTitle: "工作笔记" },
            answer,
            { ...answer, content: [{ type: "output_text", text: "完整回答" }] },
          ),
      );
      expect(transcript).toEqual({
        source: "workbuddy",
        source_id: createHash("sha256")
          .update(`workbuddy-jsonl-v1\0${sessionID}`, "utf8")
          .digest("hex"),
        title: "工作笔记",
        messages: [
          {
            role: "user",
            text: "第一问",
            timestamp: "2026-11-19T08:00:00+08:00",
          },
          {
            role: "assistant",
            text: "完整回答",
            timestamp: new Date(answer.timestamp).toISOString(),
          },
        ],
      });
      const updated = parseWorkBuddyTranscript(jsonl(question));
      expect(updated.source_id).toBe(transcript.source_id);
      expect(updated.title).toBe("第一问");
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it("projects the real user query, not injected context or its attachment paths", async () => {
    const wrapper =
      '<system-reminder data-role="user-context">CONTEXT `C:/fixture/private.txt`</system-reminder>\n' +
      '<system-reminder data-role="additional-data">EXTRA</system-reminder>\n' +
      "<user_query>Keep `C:/fixture/share.txt`</user_query>";
    const literal = "<system-reminder>literal assistant text</system-reminder>";
    const file = new File(
      [
        jsonl(
          {
            ...question,
            id: "reminder-only",
            content: [
              {
                type: "input_text",
                text: "<system-prompt>ONLY</system-prompt>",
              },
            ],
          },
          { ...question, content: [{ type: "input_text", text: wrapper }] },
          { ...answer, content: [{ type: "output_text", text: literal }] },
        ),
      ],
      "fixture.jsonl",
    );
    const [draft] = await readWorkBuddyFiles([file]);
    expect(draft.conversation.title).toBe("Keep `C:/fixture/share.txt`");
    expect(draft.conversation.messages.map(({ text }) => text)).toEqual([
      "Keep `C:/fixture/share.txt`",
      literal,
    ]);
    expect(draft.references).toEqual([{ path: "C:/fixture/share.txt" }]);
  });

  it.each([
    [
      "separate context blocks",
      [
        '<system-reminder data-role="tool-hint">Hidden `secret.md`</system-reminder>',
        "<user_query>Question `public.md`</user_query>",
      ],
    ],
    [
      "adjacent and trailing reminders with a variant data role",
      [
        "<system-reminder data-role = 'fixture-context'>Hidden `secret.md`</system-reminder><user_query>Question `public.md`</user_query>\r\n<system-reminder data-role=\"hook\">Private suffix</system-reminder>",
      ],
    ],
    [
      "a plain query after an installed reminder type",
      [
        '<system-reminder data-role="ide-context">Hidden `secret.md`</system-reminder>\nQuestion `public.md`',
      ],
    ],
  ])("projects only the question in %s", async (_name, blocks) => {
    const file = new File(
      [
        jsonl({
          ...question,
          content: blocks.map((text) => ({ type: "input_text", text })),
        }),
      ],
      "fixture.jsonl",
    );
    const [draft] = await readWorkBuddyFiles([file]);
    expect(draft.conversation.messages).toEqual([
      {
        role: "user",
        text: "Question `public.md`",
        timestamp: question.timestamp,
      },
    ]);
    expect(draft.references).toEqual([{ path: "public.md" }]);
  });

  it("does not expose an unsupported question envelope after native context", async () => {
    const file = new File(
      [
        jsonl(question, {
          ...question,
          id: "uncertain",
          content: [
            {
              type: "input_text",
              text: '<system-reminder data-role="user-context">Hidden</system-reminder>\n<unknown_envelope>Private `secret.md`</unknown_envelope>',
            },
          ],
        }),
      ],
      "fixture.jsonl",
    );
    const [draft] = await readWorkBuddyFiles([file]);
    expect(draft.conversation.messages.map(({ text }) => text)).toEqual([
      "第一问",
    ]);
    expect(draft.references).toEqual([]);
    expect(draft).toHaveProperty("omittedUnattributed", true);
  });

  it.each([
    ["a truncated last line", jsonl(question) + '\n{"type":'],
    [
      "mixed sessions",
      jsonl(question, {
        ...answer,
        sessionId: "463c9a0b-b6e4-42c3-8e23-714392eb724d",
      }),
    ],
    ["no text messages", jsonl({ type: "tool_result", sessionId: sessionID })],
  ])("rejects %s instead of sending a partial chat", (_name, input) => {
    expect(() => parseWorkBuddyTranscript(input)).toThrow(
      expect.objectContaining({ code: "transcript" }),
    );
  });
});
