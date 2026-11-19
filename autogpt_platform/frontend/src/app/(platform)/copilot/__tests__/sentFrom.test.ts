import { describe, expect, it } from "vitest";
import {
  getSentFromDisplayTitle,
  getSentFromMetadata,
  getSessionSentFrom,
  isSessionOpeningMessage,
} from "../sentFrom";

const SESSION_ID = "3f2c1a9e-7b4d-4e8a-9c1b-2d3e4f5a6b7c";
const EXPERT_ID = "9a8b7c6d-5e4f-4a3b-8c2d-1e0f9a8b7c6d";

describe("getSentFromMetadata", () => {
  it("reads the sending session and expert off message metadata", () => {
    expect(
      getSentFromMetadata({
        from_session_id: SESSION_ID,
        from_expert_id: EXPERT_ID,
        from_expert_name: "Ari",
        from_expert_job_title: " QA Engineer ",
      }),
    ).toEqual({
      sessionId: SESSION_ID,
      expertId: EXPERT_ID,
      expertJobTitle: "QA Engineer",
    });
  });

  it("keeps a plain Otto sender as a null expert", () => {
    expect(
      getSentFromMetadata({
        from_session_id: SESSION_ID,
        from_expert_id: null,
      }),
    ).toEqual({ sessionId: SESSION_ID, expertId: null });
  });

  it("ignores metadata without a valid sending session id", () => {
    expect(getSentFromMetadata(null)).toBeNull();
    expect(getSentFromMetadata({ kind: "expert_kickoff" })).toBeNull();
    expect(getSentFromMetadata({ from_session_id: "not-a-uuid" })).toBeNull();
  });
});

describe("getSessionSentFrom", () => {
  it("falls back to the session's delegation provenance", () => {
    expect(
      getSessionSentFrom({
        delegated_by_session_id: SESSION_ID,
        delegated_by_expert_id: EXPERT_ID,
      }),
    ).toEqual({ sessionId: SESSION_ID, expertId: EXPERT_ID });
  });

  it("returns null for a thread nobody delegated", () => {
    expect(getSessionSentFrom({})).toBeNull();
    expect(getSessionSentFrom(undefined)).toBeNull();
  });
});

describe("getSentFromDisplayTitle", () => {
  it("prefers the stamped profession, then the roster, then a default", () => {
    const unstamped = { sessionId: SESSION_ID, expertId: EXPERT_ID };
    const roster = { role: "Code Review & QA", jobTitle: null };
    expect(
      getSentFromDisplayTitle(
        { ...unstamped, expertJobTitle: "QA Lead" },
        roster,
        "en",
      ),
    ).toBe("QA Lead");
    expect(getSentFromDisplayTitle(unstamped, roster, "zh-CN")).toBe(
      "质量保障工程师",
    );
    expect(getSentFromDisplayTitle(unstamped, undefined, "zh-CN")).toBe(
      "AI 专家",
    );
    expect(
      getSentFromDisplayTitle(
        { ...unstamped, expertId: null },
        undefined,
        "en",
      ),
    ).toBe("General Office Assistant");
  });
});

describe("isSessionOpeningMessage", () => {
  function message(id: string, role: "user" | "assistant" = "user") {
    return { id, role, parts: [] };
  }

  it("is the user row hydrated at DB sequence 0", () => {
    expect(isSessionOpeningMessage(message("sess-seq-0"))).toBe(true);
  });

  it("is never a later row, whatever the client retained", () => {
    expect(isSessionOpeningMessage(message("sess-seq-1"))).toBe(false);
    expect(isSessionOpeningMessage(message("sess-seq-40"))).toBe(false);
  });

  it("is never a row without a DB sequence", () => {
    expect(isSessionOpeningMessage(message("user-streamed"))).toBe(false);
    expect(isSessionOpeningMessage(message("sess-idx-0"))).toBe(false);
  });

  it("is never an assistant row", () => {
    expect(isSessionOpeningMessage(message("sess-seq-0", "assistant"))).toBe(
      false,
    );
  });
});
