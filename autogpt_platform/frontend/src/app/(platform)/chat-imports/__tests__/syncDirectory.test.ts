import { ApiError } from "@/lib/autogpt-server-api/helpers";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { syncNativeConversations } from "../api";
import { openLocalHistory } from "../readLocalHistory";
import { syncDirectory } from "../syncDirectory";
import {
  encodeImport,
  MAX_BODY_BYTES,
  type ImportConversation,
} from "../validation";

vi.mock("../api", () => ({ syncNativeConversations: vi.fn() }));
vi.mock("../readLocalHistory", () => ({ openLocalHistory: vi.fn() }));

const send = vi.mocked(syncNativeConversations);
const open = vi.mocked(openLocalHistory);

function chat(index: number, text = "Test question"): ImportConversation {
  return {
    source: "workbuddy",
    source_id: index.toString(16).padStart(64, "0"),
    title: `Chat ${index}`,
    messages: [{ role: "user", text }],
  };
}

function mockHistory(chats: ImportConversation[]) {
  async function* pages() {
    for (const conversation of chats)
      yield { chats: [conversation], skipped: 0 };
  }
  const close = vi.fn();
  open.mockResolvedValue({ total: chats.length, pages: pages(), close });
  return close;
}

function sync() {
  const onProgress = vi.fn();
  const promise = syncDirectory("workbuddy", [], {
    destination: '["owner","owner"]',
    signal: new AbortController().signal,
    onProgress,
    beforeRequest: vi.fn(),
  });
  return { onProgress, promise };
}

beforeEach(() => {
  send.mockReset();
  open.mockReset();
});

describe("directory sync batches", () => {
  it("caps the UTF-8 request size, accounts for failures, and keeps syncing later batches", async () => {
    const question = "问".repeat(99_999);
    const chats = Array.from({ length: 16 }, (_, index) =>
      chat(index, question),
    );
    const close = mockHistory(chats);
    send.mockRejectedValueOnce(new ApiError("Unavailable", 503, null));
    send.mockImplementation(async (batch) => ({
      added: batch.length,
      duplicates: 0,
    }));
    const { onProgress, promise } = sync();

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
    expect(close).toHaveBeenCalledOnce();
  });

  it("stops on a session or rate-limit error without sending another batch", async () => {
    const close = mockHistory(
      Array.from({ length: 28 }, (_, index) => chat(index)),
    );
    const blocked = new ApiError("Rate limited", 429, null);
    send.mockRejectedValueOnce(blocked);
    const { onProgress, promise } = sync();

    await expect(promise).rejects.toBe(blocked);

    expect(send).toHaveBeenCalledOnce();
    expect(onProgress).toHaveBeenLastCalledWith({
      total: 28,
      added: 0,
      duplicates: 0,
      skipped: 0,
      failed: 0,
    });
    expect(close).toHaveBeenCalledOnce();
  });
});
