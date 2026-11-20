import { ApiError } from "@/lib/autogpt-server-api/helpers";
import { syncNativeConversations, type ArchiveSaveRequest } from "./api";
import type { DirectoryReview, ReviewEntry } from "./directoryReview";
import {
  ImportValidationError,
  MAX_BODY_BYTES,
  MAX_SELECTION,
  type ImportConversation,
} from "./validation";

export type DirectorySyncProgress = {
  total: number;
  added: number;
  duplicates: number;
  skipped: number;
  failed: number;
};

export function processedCount(progress: DirectorySyncProgress) {
  return (
    progress.added + progress.duplicates + progress.skipped + progress.failed
  );
}

export function shouldStopSync(error: unknown) {
  return (
    (error instanceof ImportValidationError &&
      error.code === "archive-destination") ||
    (error instanceof ApiError && [401, 403, 429].includes(error.status))
  );
}

type SyncOptions = ArchiveSaveRequest & {
  onProgress: (progress: DirectorySyncProgress) => void;
  onConfirmed?: (entries: ReviewEntry[]) => void;
  beforeRequest: () => void;
};

const EMPTY_BODY_BYTES = '{"conversations":[]}'.length;

function createBatchWriter(total: number, options: SyncOptions) {
  const { signal, onProgress, beforeRequest } = options;
  const progress = { total, added: 0, duplicates: 0, skipped: 0, failed: 0 };
  const encoder = new TextEncoder();
  const batch: { chat: ImportConversation; entry: ReviewEntry }[] = [];
  let size = EMPTY_BODY_BYTES;

  function report() {
    onProgress({ ...progress });
  }

  function skip(count: number) {
    if (!count) return;
    progress.skipped += count;
    report();
  }

  async function flush() {
    signal.throwIfAborted();
    if (!batch.length) return;
    const pending = batch.splice(0);
    const chats = pending.map(({ chat }) => chat);
    size = EMPTY_BODY_BYTES;
    beforeRequest();
    try {
      const result = await syncNativeConversations(chats, options);
      signal.throwIfAborted();
      if (
        !Number.isInteger(result?.added) ||
        !Number.isInteger(result?.duplicates) ||
        result.added < 0 ||
        result.duplicates < 0 ||
        result.added + result.duplicates !== chats.length
      ) {
        throw new Error("Incomplete conversation sync response");
      }
      progress.added += result.added;
      progress.duplicates += result.duplicates;
      options.onConfirmed?.(pending.map(({ entry }) => entry));
    } catch (error) {
      signal.throwIfAborted();
      if (shouldStopSync(error)) throw error;
      progress.failed += chats.length;
    }
    report();
  }

  async function add(chat: ImportConversation, entry: ReviewEntry) {
    signal.throwIfAborted();
    const bytes = encoder.encode(JSON.stringify(chat)).byteLength;
    if (EMPTY_BODY_BYTES + bytes > MAX_BODY_BYTES) {
      skip(1);
      return;
    }
    if (size + Number(batch.length > 0) + bytes > MAX_BODY_BYTES) await flush();
    size += bytes + Number(batch.length > 0);
    batch.push({ chat, entry });
    if (batch.length === MAX_SELECTION) await flush();
  }

  report();
  return { add, flush, skip };
}

export async function syncReviewedSelection(
  review: DirectoryReview,
  selected: ReadonlySet<ReviewEntry>,
  options: SyncOptions,
) {
  const entries = review.entries.filter((entry) => selected.has(entry));
  if (!entries.length || entries.length !== selected.size)
    throw new ImportValidationError("selection");
  const writer = createBatchWriter(entries.length, options);
  for (const entry of entries) {
    options.signal.throwIfAborted();
    await writer.add(await review.load(entry), entry);
  }
  await writer.flush();
}
