import { describe, expect, it, vi } from "vitest";
import { reviewDirectory } from "../directoryReview";
import { openLocalHistory } from "../readLocalHistory";
import type { NativeChatDraft } from "../validation";

vi.mock("../readLocalHistory", () => ({ openLocalHistory: vi.fn() }));

function draft(text: string, id = "a"): NativeChatDraft {
  return {
    conversation: {
      source: "qwenwork",
      source_id: id.repeat(64),
      title: "Same name",
      messages: [{ role: "user", text }],
    },
    references: [],
  };
}

describe("local directory review", () => {
  it("indexes the full directory without retaining message bodies and rejects changed projections", async () => {
    const controller = new AbortController();
    const close = vi.fn();
    const readPage = vi.fn(async (page: number) => ({
      entries:
        page === 0
          ? []
          : [
              draft("private text"),
              { ...draft("second", "b"), omittedUnattributed: true },
            ],
      skipped: page === 0 ? 1 : 0,
      hasOlder: page === 0,
    }));
    vi.mocked(openLocalHistory).mockResolvedValue({
      total: 3,
      readPage,
      close,
    });
    const onProgress = vi.fn();
    const review = await reviewDirectory(
      "qwenwork",
      [],
      controller.signal,
      onProgress,
    );
    expect(JSON.stringify(review)).not.toContain("private text");
    expect(review.entries).toHaveLength(2);
    expect(review.entries[1].omittedUnattributed).toBe(true);
    expect(review.skipped).toBe(1);
    expect(onProgress.mock.calls).toEqual([
      [0, 3],
      [1, 3],
      [3, 3],
    ]);
    expect(close).not.toHaveBeenCalled();
    readPage.mockResolvedValueOnce({
      entries: [draft("different text"), draft("second", "b")],
      skipped: 0,
      hasOlder: false,
    });
    await expect(review.load(review.entries[0])).rejects.toMatchObject({
      code: "history-changed",
    });
    expect(await review.load(review.entries[1])).toEqual(
      draft("second", "b").conversation,
    );
    expect(readPage).toHaveBeenCalledTimes(3);
    controller.abort();
    expect(close).toHaveBeenCalledOnce();
    await expect(review.load(review.entries[1])).rejects.toBeDefined();
  });

  it("lists identical copies once but never silently chooses between different copies of the same chat", async () => {
    const first = draft("question");
    const second = draft("an earlier answer", "b");
    vi.mocked(openLocalHistory).mockResolvedValue({
      total: 4,
      readPage: vi.fn(async () => ({
        entries: [
          first,
          { ...first, omittedUnattributed: true },
          second,
          draft("updated answer", "b"),
        ],
        skipped: 0,
        hasOlder: false,
      })),
    });
    const progress = vi.fn();
    const review = await reviewDirectory(
      "workbuddy",
      [],
      new AbortController().signal,
      progress,
    );
    expect(review).toMatchObject({
      copies: 1,
      conflicts: 1,
      entries: [{ omittedUnattributed: true }],
    });
    expect(review.entries).toHaveLength(1);
    expect(await review.load(review.entries[0])).toEqual(first.conversation);
    expect(progress).toHaveBeenLastCalledWith(4, 4);
  });

  it("closes a reader on a failed scan instead of publishing a partial directory", async () => {
    const close = vi.fn();
    const readPage = vi.fn().mockRejectedValue(new Error("read failed"));
    vi.mocked(openLocalHistory).mockResolvedValue({
      total: 4,
      close,
      readPage,
    });
    await expect(
      reviewDirectory("qwenwork", [], new AbortController().signal, vi.fn()),
    ).rejects.toThrow("read failed");
    expect(close).toHaveBeenCalledOnce();
  });
});
