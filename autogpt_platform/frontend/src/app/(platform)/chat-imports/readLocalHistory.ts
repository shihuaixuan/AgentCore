import { findQwenWorkDatabase } from "./qwenWorkDirectory";
import { openQwenWorkReader } from "./readQwenWorkInWorker";
import {
  ImportValidationError,
  type ImportConversation,
  type NativeChatDraft,
} from "./validation";
import {
  findWorkBuddyTranscripts,
  readWorkBuddyTranscriptDraftFile,
} from "./workbuddyDirectory";

export type NativeImportSource = ImportConversation["source"];

type HistoryPage = {
  entries: NativeChatDraft[];
  skipped: number;
  hasOlder: boolean;
};

type LocalHistory = {
  total: number;
  readPage: (page: number) => Promise<HistoryPage>;
  close?: () => void;
};

export async function openLocalHistory(
  source: NativeImportSource,
  files: File[],
  signal: AbortSignal,
): Promise<LocalHistory> {
  signal.throwIfAborted();
  if (source === "workbuddy") {
    const candidates = findWorkBuddyTranscripts(files);
    if (!candidates.length) throw new ImportValidationError("workbuddy-folder");
    return {
      total: candidates.length,
      async readPage(page) {
        signal.throwIfAborted();
        const hasOlder = page + 1 < candidates.length;
        try {
          const entry = await readWorkBuddyTranscriptDraftFile(
            candidates[page],
          );
          return { entries: [entry], skipped: 0, hasOlder };
        } catch {
          signal.throwIfAborted();
          return { entries: [], skipped: 1, hasOlder };
        }
      },
    };
  }

  const database = findQwenWorkDatabase(files);
  const raw = await database.arrayBuffer().catch(() => {
    throw new ImportValidationError("qwenwork-reader");
  });
  signal.throwIfAborted();
  return openQwenWorkReader(raw, signal);
}
