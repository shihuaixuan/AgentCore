import { findQwenWorkDatabase } from "./qwenWorkDirectory";
import { openQwenWorkReader } from "./readQwenWorkInWorker";
import { ImportValidationError, type ImportConversation } from "./validation";
import {
  findWorkBuddyTranscripts,
  readWorkBuddyTranscriptFile,
} from "./workbuddyDirectory";

export type NativeImportSource = ImportConversation["source"];

type HistoryPage = { chats: ImportConversation[]; skipped: number };

type LocalHistory = {
  total: number;
  pages: AsyncGenerator<HistoryPage>;
  close?: () => void;
};

async function* workBuddyPages(files: File[], signal: AbortSignal) {
  for (const file of files) {
    signal.throwIfAborted();
    let conversation: ImportConversation;
    try {
      conversation = await readWorkBuddyTranscriptFile(file);
    } catch {
      signal.throwIfAborted();
      yield { chats: [], skipped: 1 };
      continue;
    }
    signal.throwIfAborted();
    yield { chats: [conversation], skipped: 0 };
  }
}

async function* qwenWorkPages(
  reader: Awaited<ReturnType<typeof openQwenWorkReader>>,
  signal: AbortSignal,
) {
  if (!reader.total) return;
  for (let page = 0; ; page++) {
    signal.throwIfAborted();
    const result = await reader.readPage(page);
    signal.throwIfAborted();
    yield {
      chats: result.entries.map(({ conversation }) => conversation),
      skipped: result.skipped,
    };
    if (!result.hasOlder) return;
  }
}

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
      pages: workBuddyPages(candidates, signal),
    };
  }

  const database = findQwenWorkDatabase(files);
  const raw = await database.arrayBuffer().catch(() => {
    throw new ImportValidationError("qwenwork-reader");
  });
  signal.throwIfAborted();
  const reader = await openQwenWorkReader(raw, signal);
  return {
    total: reader.total,
    pages: qwenWorkPages(reader, signal),
    close: () => reader.close(),
  };
}
