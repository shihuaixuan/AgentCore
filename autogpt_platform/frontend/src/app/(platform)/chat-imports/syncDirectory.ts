import { ApiError } from "@/lib/autogpt-server-api/helpers";
import { syncNativeConversations, type ArchiveSaveRequest } from "./api";
import { openLocalHistory, type NativeImportSource } from "./readLocalHistory";
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
  beforeRequest: () => void;
};

const EMPTY_BODY_BYTES = '{"conversations":[]}'.length;

function createBatchWriter(total: number, options: SyncOptions) {
  const { signal, onProgress, beforeRequest } = options;
  const progress = { total, added: 0, duplicates: 0, skipped: 0, failed: 0 };
  const encoder = new TextEncoder();
  const batch: ImportConversation[] = [];
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
    const chats = batch.splice(0);
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
    } catch (error) {
      signal.throwIfAborted();
      if (shouldStopSync(error)) throw error;
      progress.failed += chats.length;
    }
    report();
  }

  async function add(chat: ImportConversation) {
    signal.throwIfAborted();
    const bytes = encoder.encode(JSON.stringify(chat)).byteLength;
    if (EMPTY_BODY_BYTES + bytes > MAX_BODY_BYTES) {
      skip(1);
      return;
    }
    if (size + Number(batch.length > 0) + bytes > MAX_BODY_BYTES) await flush();
    size += bytes + Number(batch.length > 0);
    batch.push(chat);
    if (batch.length === MAX_SELECTION) await flush();
  }

  report();
  return { add, flush, skip };
}

export async function syncDirectory(
  source: NativeImportSource,
  files: File[],
  options: SyncOptions,
) {
  const history = await openLocalHistory(source, files, options.signal);
  try {
    const writer = createBatchWriter(history.total, options);
    for await (const { chats, skipped } of history.pages) {
      writer.skip(skipped);
      for (const chat of chats) await writer.add(chat);
    }
    await writer.flush();
  } finally {
    history.close?.();
  }
}
