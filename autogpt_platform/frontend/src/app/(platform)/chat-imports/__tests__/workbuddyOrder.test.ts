import { describe, expect, it } from "vitest";
import { parseWorkBuddyTranscript } from "../workbuddyTranscript";

const sessionId = "ordering-fixture";
function message(id: string, role: "user" | "assistant", parentId?: string) {
  return {
    type: "message",
    role,
    id,
    parentId,
    sessionId,
    timestamp: role === "user" ? 200 : 100,
    content: [
      { type: role === "user" ? "input_text" : "output_text", text: id },
    ],
  };
}

function project(...rows: unknown[]) {
  return parseWorkBuddyTranscript(
    rows.map((row) => JSON.stringify(row)).join("\n"),
  );
}

describe("WorkBuddy causal replay", () => {
  const question = message("Question", "user");
  const progress = message("Progress", "assistant", "thinking");
  const final = message("Answer", "assistant", "result");
  const next = message("Next question", "user", final.id);
  const thinking = {
    type: "reasoning",
    sessionId,
    id: "thinking",
    parentId: question.id,
  };
  const call = {
    type: "function_call",
    sessionId,
    id: "call",
    parentId: progress.id,
  };
  const result = {
    type: "function_call_result",
    sessionId,
    id: "result",
    parentId: call.id,
  };

  it("reconstructs a single parent chain through non-public steps, independently of row order and clocks", () => {
    const rows = [question, thinking, progress, call, result, final, next];
    for (const order of [
      rows,
      rows.toReversed(),
      [next, progress, result, question, final, call, thinking],
    ]) {
      const chat = project(
        { type: "session-meta", sessionId, meta: {} },
        ...order,
        { type: "file-history-snapshot" },
      );
      expect(chat.title).toBe("Question");
      expect(chat.messages.map(({ text }) => text)).toEqual([
        "Question",
        "Progress",
        "Answer",
        "Next question",
      ]);
    }
  });

  it("uses committed JSONL order, not timestamps, in legacy transcripts without links", () => {
    const chat = project(
      question,
      message("Earlier clock", "assistant"),
      message("Follow-up", "user"),
    );
    expect(chat.messages.map(({ text }) => text)).toEqual([
      "Question",
      "Earlier clock",
      "Follow-up",
    ]);
  });

  it("keeps identical intermediate text at distinct committed IDs, not a duplicate snapshot of one ID", () => {
    const second = { ...progress, id: "later-step", parentId: result.id };
    const chat = project(
      { ...final, parentId: second.id },
      second,
      thinking,
      question,
      result,
      call,
      progress,
      progress,
    );
    expect(chat.messages.map(({ text }) => text)).toEqual([
      "Question",
      "Progress",
      "Progress",
      "Answer",
    ]);
  });

  it.each([
    [
      "two possible replies",
      [
        question,
        thinking,
        progress,
        message("Other reply", "assistant", thinking.id),
      ],
    ],
    ["missing parent", [question, final]],
    [
      "disconnected chains",
      [
        next,
        final,
        question,
        thinking,
        progress,
        call,
        result,
        message("Detached", "user"),
      ],
    ],
    ["cycle", [question, { ...final, parentId: next.id }, next]],
    ["self-parent", [question, { ...final, parentId: final.id }]],
    [
      "changed parent for a committed ID",
      [question, thinking, progress, { ...progress, parentId: question.id }],
    ],
  ])(
    "rejects %s rather than choosing by timestamp or last row",
    (_name, rows) => {
      expect(() => project(...rows)).toThrow("transcript");
    },
  );
});
