import { sha256 } from "@noble/hashes/sha2.js";
import { bytesToHex } from "@noble/hashes/utils.js";
import { openLocalHistory, type NativeImportSource } from "./readLocalHistory";
import { ImportValidationError, type ImportConversation } from "./validation";

type History = Awaited<ReturnType<typeof openLocalHistory>>;
type HistoryPage = Awaited<ReturnType<History["readPage"]>>;

export type ReviewEntry = {
  title: string;
  messageCount: number;
  page: number;
  slot: number;
  fingerprint: string;
  omittedUnattributed?: boolean;
};

export type DirectoryReview = {
  entries: ReviewEntry[];
  skipped: number;
  copies: number;
  conflicts: number;
  load: (entry: ReviewEntry) => Promise<ImportConversation>;
};

function fingerprint(chat: ImportConversation) {
  return bytesToHex(sha256(new TextEncoder().encode(JSON.stringify(chat))));
}

function snapshotLoader(history: History, signal: AbortSignal) {
  let cached: { page: number; result: Promise<HistoryPage> } | undefined;
  let idle = Promise.resolve();
  return async function load(entry: ReviewEntry) {
    signal.throwIfAborted();
    if (cached?.page !== entry.page) {
      const result = idle.then(() => {
        signal.throwIfAborted();
        return history.readPage(entry.page);
      });
      idle = result.then(
        () => undefined,
        () => undefined,
      );
      cached = { page: entry.page, result };
    }
    const result = await cached.result;
    signal.throwIfAborted();
    const chat = result.entries[entry.slot]?.conversation;
    if (!chat || fingerprint(chat) !== entry.fingerprint)
      throw new ImportValidationError("history-changed");
    return chat;
  };
}

export async function reviewDirectory(
  source: NativeImportSource,
  files: File[],
  signal: AbortSignal,
  onProgress: (read: number, total: number) => void,
): Promise<DirectoryReview> {
  const history = await openLocalHistory(source, files, signal);
  const close = () => history.close?.();
  signal.addEventListener("abort", close, { once: true });
  try {
    signal.throwIfAborted();
    const index = new Map<string, ReviewEntry | null>();
    let skipped = 0;
    let copies = 0;
    let conflicts = 0;
    let read = 0;
    onProgress(0, history.total);
    for (let page = 0; history.total > 0; page++) {
      const result = await history.readPage(page);
      signal.throwIfAborted();
      for (const [
        slot,
        { conversation, omittedUnattributed },
      ] of result.entries.entries()) {
        const key = conversation.source_id;
        const previous = index.get(key);
        const digest = fingerprint(conversation);
        if (previous === undefined)
          index.set(key, {
            title: conversation.title,
            messageCount: conversation.messages.length,
            page,
            slot,
            fingerprint: digest,
            omittedUnattributed,
          });
        else if (previous?.fingerprint === digest) {
          previous.omittedUnattributed ||= omittedUnattributed;
          copies++;
        } else if (previous !== null) {
          index.set(key, null);
          conflicts++;
        }
      }
      skipped += result.skipped;
      read += result.entries.length + result.skipped;
      onProgress(read, history.total);
      if (!result.hasOlder) break;
    }
    const entries = [...index.values()].filter((entry) => entry !== null);
    return {
      entries,
      skipped,
      copies,
      conflicts,
      load: snapshotLoader(history, signal),
    };
  } catch (error) {
    signal.removeEventListener("abort", close);
    close();
    throw error;
  }
}
