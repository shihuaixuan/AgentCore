import { describe, expect, it } from "vitest";
import {
  parseWorkBuddyTranscript,
  readWorkBuddyFiles,
} from "../workbuddyTranscript";

const sessionId = "fixture-session";
const main = "fixture-expert";
const child = "fixture-worker";
const cwd = "C:/Fixture";

function message(
  role: "user" | "assistant",
  id: string,
  text: string,
  providerData: Record<string, unknown> = {},
) {
  return {
    type: "message",
    sessionId,
    id,
    role,
    cwd,
    providerData,
    content: [{ type: role === "user" ? "input_text" : "output_text", text }],
  };
}

function metadata(meta: Record<string, unknown>) {
  return { type: "session-meta", sessionId, meta };
}

function jsonl(rows: unknown[]) {
  return rows.map((row) => JSON.stringify(row)).join("\n");
}

async function read(...rows: unknown[]) {
  const [draft] = await readWorkBuddyFiles([
    new File([jsonl(rows)], "fixture.jsonl"),
  ]);
  return draft;
}

const start = {
  agent: main,
  startsNewUserRequest: true,
  conversationRequestId: "turn",
};
const reply = { agent: main, conversationRequestId: "turn" };
const question = message(
  "user",
  "question",
  "<user_query>Question</user_query>",
  start,
);
const answer = message("assistant", "answer", "Answer", reply);

describe("WorkBuddy public dialogue projection", () => {
  it.each(["cli", main])(
    "keeps the directly addressed %s and every committed intermediate reply in replay order",
    async (agent) => {
      const correlation = {
        agent,
        conversationRequestId: "turn",
        messageId: "generation",
      };
      const progress = message("assistant", "progress", "Starting", {
        ...correlation,
        stepSeq: 1,
      });
      const final = message("assistant", "final", "Done", {
        ...correlation,
        stepSeq: 3,
      });
      const draft = await read(
        {
          ...final,
          status: "in_progress",
          content: [{ type: "output_text", text: "Draft `draft.txt`" }],
        },
        { ...question, providerData: { ...start, agent }, timestamp: 300 },
        {
          ...progress,
          status: "completed",
          parentId: question.id,
          timestamp: 200,
        },
        {
          type: "function_call",
          name: "Read",
          sessionId,
          parentId: progress.id,
          id: "call",
        },
        {
          type: "function_call_result",
          sessionId,
          id: "result",
          parentId: "call",
          output: "Private",
        },
        { ...final, status: "completed", parentId: "result", timestamp: 100 },
      );
      expect(draft.conversation.messages.map(({ text }) => text)).toEqual([
        "Question",
        "Starting",
        "Done",
      ]);
      expect(draft.references).toEqual([]);
      expect(draft).not.toHaveProperty("omittedUnattributed");
    },
  );

  it("keeps a standalone named expert without a standing declaration", async () => {
    const draft = await read(
      message("user", "question", "Direct question"),
      answer,
    );
    expect(draft.conversation.messages.map(({ text }) => text)).toEqual([
      "Direct question",
      "Answer",
    ]);
  });

  it("uses a declared main, even when a different (cli) actor goes first or is more frequent", async () => {
    const draft = await read(
      metadata({ multitaskMode: true }),
      question,
      message("assistant", "first", "Private `child.txt`", { agent: "cli" }),
      message("user", "dispatch", "Private instruction", { agent: "cli" }),
      answer,
      metadata({ "codebuddy.ai/mainAgent": main }),
    );
    expect(draft.conversation.messages.map(({ text }) => text)).toEqual([
      "Question",
      "Answer",
    ]);
    expect(draft.references).toEqual([]);
    expect(draft).not.toHaveProperty("omittedUnattributed");
  });

  it("does not promote the first or sole worker in a delegated request", async () => {
    const draft = await read(
      metadata({ delegateMode: true }),
      message("user", "question", "Question", { startsNewUserRequest: true }),
      message("assistant", "worker", "Not a public answer `child.txt`", {
        agent: child,
      }),
      message("assistant", "unknown", "Unknown `unknown.txt`"),
    );
    expect(draft.conversation.messages).toEqual([
      { role: "user", text: "Question" },
    ]);
    expect(draft.references).toEqual([]);
    expect(draft).toHaveProperty("omittedUnattributed", true);
  });

  it("uses the request's user speaker, not a global allow-list of every directly addressed expert", async () => {
    const draft = await read(
      question,
      answer,
      message("user", "next", "Next", {
        ...start,
        agent: child,
        conversationRequestId: "next",
      }),
      message("assistant", "worker", "Private", {
        ...reply,
        conversationRequestId: "next",
      }),
      message("assistant", "next-answer", "Next answer", {
        agent: child,
        conversationRequestId: "next",
      }),
    );
    expect(draft.conversation.messages.map(({ text }) => text)).toEqual([
      "Question",
      "Answer",
      "Next",
      "Next answer",
    ]);
  });

  it("excludes explicitly delegated messages and titles even when the speaker label matches the main", async () => {
    const delegated = message(
      "user",
      "worker",
      "<user_query>Private `child.txt`</user_query>",
      start,
    );
    const draft = await read(
      { ...delegated, parentToolUseId: "call", cwd: "C:/Private" },
      {
        type: "ai-title",
        sessionId,
        aiTitle: "Private title",
        subagent: { version: 1, sessionId: "worker" },
      },
      question,
      { ...answer, id: "team", providerData: { ...reply, isTeamMember: true } },
      { ...answer, id: "side", isSidechain: true },
      {
        ...answer,
        id: "child",
        providerData: {
          ...reply,
          subagentContext: { parentToolCallId: "call" },
        },
      },
      answer,
    );
    expect(draft.conversation.title).toBe("Question");
    expect(draft.conversation.messages.map(({ text }) => text)).toEqual([
      "Question",
      "Answer",
    ]);
    expect(draft.references).toEqual([]);
    expect(draft.cwd).toBe(cwd);
  });

  it("excludes internal inputs and aborted, pending or staged output without using text heuristics", async () => {
    const literal =
      "Quote: `<teammate-message>` and <system-reminder>literal</system-reminder>";
    const hidden = {
      ...question,
      content: [{ type: "input_text", text: "Internal `private.md`" }],
    };
    const draft = await read(
      ...[
        { isMeta: true },
        { skipRun: true },
        { isAdditionalData: true },
        { isCompactInternal: true },
        { teammateMessage: { from: "system" } },
        { scheduledTaskTrigger: {} },
        { __codebuddyInitiator: "agent" },
      ].map((flags, index) => ({
        ...hidden,
        id: `hidden-${index}`,
        providerData: { ...start, ...flags },
      })),
      { ...question, content: `<user_query>${literal}</user_query>` },
      {
        ...answer,
        id: "aborted",
        status: "incomplete",
        providerData: { ...reply, isPartialAborted: true },
      },
      { ...answer, id: "pending", status: "pending" },
      { ...answer, id: "stage", type: "draft" },
      { ...answer, content: literal },
    );
    expect(draft.conversation.messages.map(({ text }) => text)).toEqual([
      literal,
      literal,
    ]);
    expect(draft.references).toEqual([]);
  });

  it("marks missing or conflicting roles in a mixed log; no private path or cwd survives", async () => {
    const unknown = {
      ...answer,
      id: "unknown",
      cwd: "C:/Private",
      content: [{ type: "text", text: "Unknown `unknown.txt`" }],
    };
    const draft = await read(
      metadata({ "codebuddy.ai/mainAgent": main, multitaskMode: true }),
      question,
      answer,
      { ...unknown, providerData: {} },
      { ...unknown, id: "missing", role: null },
      { ...unknown, id: "conflict", message: { role: "user" } },
    );
    expect(draft.conversation.messages.map(({ text }) => text)).toEqual([
      "Question",
      "Answer",
    ]);
    expect(draft.references).toEqual([]);
    expect(draft).toHaveProperty("omittedUnattributed", true);
  });

  it("only extracts attachments from the surviving public record and role-appropriate blocks", async () => {
    const draft = await read(
      {
        ...question,
        content: [{ type: "input_text", text: "Old `old.md`" }],
        cwd: "C:/Old",
      },
      {
        ...question,
        content: [
          ...question.content,
          { type: "output_text", text: "Wrong side `wrong.md`" },
        ],
      },
      {
        ...answer,
        id: "attachment",
        content: [{ type: "output_file", path: "output.pdf" }],
      },
      { ...answer, content: [{ type: "text", text: "Read `reply.md`" }] },
    );
    expect(draft.references).toEqual([
      { path: "output.pdf", cwd },
      { path: "reply.md", cwd },
    ]);
    expect(draft.cwd).toBe(cwd);
    expect(draft.conversation.messages.map(({ text }) => text)).toEqual([
      "Question",
      "Read `reply.md`",
    ]);
  });

  it("does not treat an unclear continuation or an unterminated context block as a question", async () => {
    const draft = await read(
      question,
      message("user", "continuation", "Private `continuation.md`", {
        ...reply,
        startsNewUserRequest: false,
      }),
      {
        ...question,
        id: "split",
        content: [
          {
            type: "input_text",
            text: '<system-reminder data-role="message-queue">',
          },
          {
            type: "input_text",
            text: "<user_query>Private `queued.md`</user_query>",
          },
          { type: "input_text", text: "</system-reminder>" },
        ],
      },
      answer,
    );
    expect(draft.conversation.messages.map(({ text }) => text)).toEqual([
      "Question",
      "Answer",
    ]);
    expect(draft.references).toEqual([]);
    expect(draft).toHaveProperty("omittedUnattributed", true);
  });

  it("keeps an explicitly accepted steer, not queued metadata or nested tool text", async () => {
    const steer = message("user", "steer", "Also compare B", {
      ...reply,
      startsNewUserRequest: false,
      clientMeta: {
        "codebuddy.ai": {
          queueOrigin: "steer",
          queueItemId: "fixture-queue-item",
        },
      },
    });
    const draft = await read(
      question,
      { ...steer, type: "queue" },
      steer,
      answer,
    );
    expect(draft.conversation.messages.map(({ text }) => text)).toEqual([
      "Question",
      "Also compare B",
      "Answer",
    ]);
    expect(draft).not.toHaveProperty("omittedUnattributed");
  });

  it("does not reuse an old request's speaker after an unassigned user boundary", async () => {
    const draft = await read(
      question,
      answer,
      message("user", "orphan", "Cannot attribute"),
      message("assistant", "maybe", "Cannot attribute", { agent: main }),
      message("assistant", "foreign", "Cannot attribute", { agent: child }),
    );
    expect(draft.conversation.messages.map(({ text }) => text)).toEqual([
      "Question",
      "Answer",
    ]);
    expect(draft).toHaveProperty("omittedUnattributed", true);
  });

  it("keeps accepted channel text but not its transport attributes or an unverified question variant", async () => {
    const channel =
      '<channel source="fixture" sender="transport">Compare A &amp; B</channel>';
    const draft = await read(
      { ...question, content: channel },
      message(
        "user",
        "unclear",
        '<user_question format="internal">Maybe `private.md`</user_question>',
      ),
      answer,
    );
    expect(draft.conversation.messages.map(({ text }) => text)).toEqual([
      "Compare A & B",
      "Answer",
    ]);
    expect(draft.references).toEqual([]);
    expect(draft).toHaveProperty("omittedUnattributed", true);
  });

  it("preserves attachment order in public blocks, never using a conflicting block as dialogue", async () => {
    const draft = await read(
      question,
      {
        ...answer,
        content: [
          { type: "output_file", path: "first.pdf" },
          { type: "output_text", text: "See `second.pdf`" },
          { type: "output_file", path: "third.pdf" },
        ],
      },
      {
        ...answer,
        id: "mixed",
        content: [
          { type: "output_text", text: "A public reply" },
          {
            type: "output_text",
            providerData: { agent: child },
            text: "Worker `private.md`",
          },
        ],
      },
    );
    expect(draft.references.map(({ path }) => path)).toEqual([
      "first.pdf",
      "second.pdf",
      "third.pdf",
    ]);
    expect(draft.conversation.messages.map(({ text }) => text)).toEqual([
      "Question",
      "See `second.pdf`",
      "A public reply",
    ]);
    expect(draft).toHaveProperty("omittedUnattributed", true);
  });

  it.each([
    [
      metadata({ "codebuddy.ai/mainAgent": main }),
      metadata({ "codebuddy.ai/mainAgent": child }),
      question,
    ],
    [metadata({ parentSessionId: "parent" }), question],
    [{ ...question, sessionId: "agent-fixture" }],
    [question, { ...answer, id: question.id }],
    [question, { ...question, providerData: { ...start, isMeta: true } }],
    [
      question,
      { type: "resend-fork-notice", sessionId, parentId: question.id },
      answer,
    ],
  ])(
    "rejects conflicting identity, child sessions and unsupported forks",
    (...rows) => {
      expect(() => parseWorkBuddyTranscript(jsonl(rows))).toThrow("transcript");
    },
  );
});
