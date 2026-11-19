import { customMutator } from "@/app/api/mutators/custom-mutator";
import {
  encodeImport,
  type ImportConversation,
  type ImportMessage,
} from "./validation";

export const ARCHIVE_PAGE_SIZE = 25;
const IMPORTS_URL = "/api/chat/imports";

export type ArchiveSummary = {
  id: string;
  source: ImportConversation["source"];
  title: string;
  created_at: string | null;
  imported_at: string;
  message_count: number;
};

type ArchiveList = { items: ArchiveSummary[]; has_more: boolean };
type ArchiveConversation = ArchiveSummary & {
  messages: ImportMessage[];
  attachments?: { id: string; name: string; size: number }[];
};
export type SaveResult = { added: number; duplicates: number };

async function requestArchive<T>(
  path: string,
  options: RequestInit,
  binary = false,
) {
  const result = await customMutator<{
    data: T;
    status: number;
    headers: Headers;
  }>(
    `${IMPORTS_URL}${path}`,
    { ...options, cache: "no-store", redirect: "error" },
    { sensitive: true, binary },
  );
  return result.data;
}

export function listArchive(offset: number, signal: AbortSignal) {
  return requestArchive<ArchiveList>(
    `?offset=${offset}&limit=${ARCHIVE_PAGE_SIZE}`,
    { method: "GET", signal },
  );
}

export function getArchivedConversation(id: string, signal: AbortSignal) {
  return requestArchive<ArchiveConversation>(`/${encodeURIComponent(id)}`, {
    method: "GET",
    signal,
  });
}

export function saveConversations(conversations: ImportConversation[]) {
  return requestArchive<SaveResult>("", {
    method: "POST",
    body: encodeImport(conversations),
  });
}

export function saveWithAttachments(
  conversation: ImportConversation,
  files: File[],
) {
  const body = new FormData();
  body.append("conversation", JSON.stringify(conversation));
  for (const file of files) body.append("files", file, file.name);
  return requestArchive<SaveResult>("/with-attachments", {
    method: "POST",
    body,
  });
}

export function getAttachment(chatID: string, attachmentID: string) {
  return requestArchive<Blob>(
    `/${encodeURIComponent(chatID)}/attachments/${encodeURIComponent(attachmentID)}`,
    { method: "GET" },
    true,
  );
}

export async function deleteArchivedConversation(id: string) {
  await requestArchive<null>(`/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
}
