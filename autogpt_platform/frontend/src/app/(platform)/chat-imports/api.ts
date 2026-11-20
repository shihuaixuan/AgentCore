import type { ImportedChatSyncResult } from "@/app/api/__generated__/models/importedChatSyncResult";
import { customMutator } from "@/app/api/mutators/custom-mutator";
import { ApiError } from "@/lib/autogpt-server-api/helpers";
import { ARCHIVE_DESTINATION_HEADER_NAME } from "@/lib/constants";
import { ImpersonationState } from "@/lib/impersonation";
import {
  encodeImport,
  ImportValidationError,
  type ImportConversation,
  type ImportMessage,
} from "./validation";

export const ARCHIVE_PAGE_SIZE = 25;
const IMPORTS_URL = "/api/chat/imports";

export type ArchiveSummary = {
  id: string;
  source: ImportConversation["source"] | "qianwen";
  title: string;
  created_at: string | null;
  imported_at: string;
  message_count: number;
};

type ArchiveList = { items: ArchiveSummary[]; has_more: boolean };
export type ArchiveAttachment = { id: string; name: string; size: number };
type ArchiveConversation = ArchiveSummary & {
  messages: ImportMessage[];
  attachments?: ArchiveAttachment[];
};
export type SaveResult = { added: number; duplicates: number };
export type ArchiveSaveRequest = { destination: string; signal: AbortSignal };

export function archiveDestination(ownerID: string) {
  return JSON.stringify([ownerID, ImpersonationState.get() ?? ownerID]);
}

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

async function saveArchive<T = SaveResult>(
  path: string,
  body: string | FormData | undefined,
  { destination, signal }: ArchiveSaveRequest,
) {
  signal.throwIfAborted();
  try {
    return await requestArchive<T>(path, {
      method: "POST",
      body,
      signal,
      headers: { [ARCHIVE_DESTINATION_HEADER_NAME]: destination },
    });
  } catch (error) {
    if (error instanceof ApiError && error.status === 412)
      throw new ImportValidationError("archive-destination");
    throw error;
  }
}

export function syncArchivedConversation(
  id: string,
  request: ArchiveSaveRequest,
) {
  return saveArchive<ImportedChatSyncResult>(
    `/${encodeURIComponent(id)}/sync`,
    undefined,
    request,
  );
}

export function saveConversations(
  conversations: ImportConversation[],
  request: ArchiveSaveRequest,
) {
  return saveArchive("", encodeImport(conversations), request);
}

export function saveWithAttachments(
  conversation: ImportConversation,
  files: File[],
  request: ArchiveSaveRequest,
) {
  const body = new FormData();
  body.append("conversation", JSON.stringify(conversation));
  for (const file of files) body.append("files", file, file.name);
  return saveArchive("/with-attachments", body, request);
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
