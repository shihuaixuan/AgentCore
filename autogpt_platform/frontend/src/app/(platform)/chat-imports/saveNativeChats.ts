import {
  saveConversations,
  saveWithAttachments,
  type ArchiveSaveRequest,
  type SaveResult,
} from "./api";
import {
  encodeImport,
  ImportValidationError,
  type ImportConversation,
} from "./validation";

type NativeChatSelection = {
  conversation: ImportConversation;
  files: File[];
};

function fitsHostedUpload({ conversation, files }: NativeChatSelection) {
  const encoder = new TextEncoder();
  const bytes = files.reduce(
    (total, file) =>
      total + file.size + 3 * encoder.encode(file.name).byteLength,
    encoder.encode(JSON.stringify(conversation)).byteLength,
  );
  return bytes <= 4 * 1024 * 1024;
}

export class PartialArchiveSaveError extends Error {
  constructor(
    readonly confirmed: SaveResult,
    cause: unknown,
  ) {
    super("Some archive requests did not complete.", { cause });
  }
}

export async function saveNativeChats(
  entries: NativeChatSelection[],
  request: ArchiveSaveRequest,
  onConfirmed: (indexes: number[]) => void,
) {
  encodeImport(entries.map(({ conversation }) => conversation));
  const indexed = entries.map((entry, index) => ({ ...entry, index }));
  const textOnly = indexed.filter(({ files }) => !files.length);
  const withFiles = indexed.filter(({ files }) => files.length);
  if (
    process.env.NEXT_PUBLIC_VERCEL_ENV &&
    withFiles.some((entry) => !fitsHostedUpload(entry))
  ) {
    throw new ImportValidationError("hosted-upload-size");
  }
  const confirmed = { added: 0, duplicates: 0 };
  function track(result: SaveResult) {
    confirmed.added += result.added;
    confirmed.duplicates += result.duplicates;
  }
  try {
    if (textOnly.length) {
      track(
        await saveConversations(
          textOnly.map(({ conversation }) => conversation),
          request,
        ),
      );
      onConfirmed(textOnly.map(({ index }) => index));
    }
    for (const { conversation, files, index } of withFiles) {
      track(await saveWithAttachments(conversation, files, request));
      onConfirmed([index]);
    }
  } catch (error) {
    if (confirmed.added + confirmed.duplicates)
      throw new PartialArchiveSaveError(confirmed, error);
    throw error;
  }
  return confirmed;
}
