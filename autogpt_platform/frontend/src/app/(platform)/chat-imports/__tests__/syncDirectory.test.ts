import { ApiError } from "@/lib/autogpt-server-api/helpers";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { syncNativeConversations } from "../api";
import type { DirectoryReview } from "../directoryReview";
import { syncReviewedSelection } from "../syncDirectory";
import {
  encodeImport,
  MAX_BODY_BYTES,
  type ImportConversation,
} from "../validation";

vi.mock("../api", () => ({ syncNativeConversations: vi.fn() }));

const send = vi.mocked(syncNativeConversations);

function chat(index: number, text = "Test question"): ImportConversation {
  return {
    source: "workbuddy",
    source_id: index.toString(16).padStart(64, "0"),
    title: `Chat ${index}`,
    messages: [{ role: "user", text }],
  };
}

function mockReview(chats: ImportConversation[]): DirectoryReview {
  return {
    entries: chats.map((chat, page) => ({
      page,
      slot: 0,
      fingerprint: "fixture",
      title: chat.title,
      messageCount: 1,
    })),
    skipped: 0,
    copies: 0,
    conflicts: 0,
    load: vi.fn(async (entry) => chats[entry.page]),
  };
}

function sync(review: DirectoryReview, selected = new Set(review.entries)) {
  const onProgress = vi.fn();
  const onConfirmed = vi.fn();
  const promise = syncReviewedSelection(review, selected, {
    destination: '["owner","owner"]',
    signal: new AbortController().signal,
    onProgress,
    onConfirmed,
    beforeRequest: vi.fn(),
  });
  return { onProgress, onConfirmed, promise };
}

beforeEach(() => {
  send.mockReset();
});

describe("directory sync batches", () => {
  it("caps the UTF-8 request size, accounts for failures, and keeps syncing later batches", async () => {
    const question = "问".repeat(99_999);
    const chats = Array.from({ length: 16 }, (_, index) =>
      chat(index, question),
    );
    const review = mockReview(chats);
    send.mockRejectedValueOnce(new ApiError("Unavailable", 503, null));
    send.mockImplementation(async (batch) => ({
      added: batch.length,
      duplicates: 0,
    }));
    const { onProgress, onConfirmed, promise } = sync(review);

    await promise;

    const batches = send.mock.calls.map(([batch]) => batch);
    expect(batches.map((batch) => batch.length)).toEqual([13, 3]);
    for (const batch of batches) {
      expect(
        new TextEncoder().encode(encodeImport(batch)).byteLength,
      ).toBeLessThanOrEqual(MAX_BODY_BYTES);
    }
    expect(batches.flat()).toEqual(chats);
    expect(onProgress).toHaveBeenLastCalledWith({
      total: 16,
      added: 3,
      duplicates: 0,
      skipped: 0,
      failed: 13,
    });
    expect(onConfirmed.mock.calls).toEqual([[review.entries.slice(13)]]);
  });

  it("stops on a session or rate-limit error without sending another batch", async () => {
    const review = mockReview(
      Array.from({ length: 28 }, (_, index) => chat(index)),
    );
    const blocked = new ApiError("Rate limited", 429, null);
    send.mockRejectedValueOnce(blocked);
    const { onProgress, onConfirmed, promise } = sync(review);

    await expect(promise).rejects.toBe(blocked);

    expect(send).toHaveBeenCalledOnce();
    expect(onProgress).toHaveBeenLastCalledWith({
      total: 28,
      added: 0,
      duplicates: 0,
      skipped: 0,
      failed: 0,
    });
    expect(onConfirmed).not.toHaveBeenCalled();
  });

  it("does not read or send unchecked entries and rejects a stale selection", async () => {
    const review = mockReview([chat(0), chat(1), chat(2)]);
    const selected = new Set([review.entries[2], review.entries[0]]);
    send.mockResolvedValue({ added: 2, duplicates: 0 });
    await sync(review, selected).promise;
    expect(vi.mocked(review.load).mock.calls.flat()).toEqual([
      review.entries[0],
      review.entries[2],
    ]);
    expect(send.mock.calls[0][0]).toEqual([chat(0), chat(2)]);
    await expect(
      sync(mockReview([chat(3)]), selected).promise,
    ).rejects.toMatchObject({ code: "selection" });
    expect(send).toHaveBeenCalledOnce();
  });
});
