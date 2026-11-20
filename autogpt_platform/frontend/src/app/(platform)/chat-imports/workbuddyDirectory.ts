import { ImportValidationError, type ImportConversation } from "./validation";
import {
  MAX_WORKBUDDY_FILE_BYTES,
  parseWorkBuddyTranscript,
} from "./workbuddyTranscript";

function isTranscript(file: File) {
  return /\.jsonl$/i.test(file.name);
}

export function findWorkBuddyTranscripts(files: File[]): File[] {
  return files.filter(isTranscript);
}

export async function readWorkBuddyTranscriptFile(
  file: File,
): Promise<ImportConversation> {
  if (!isTranscript(file)) throw new ImportValidationError("file-type");
  if (file.size > MAX_WORKBUDDY_FILE_BYTES)
    throw new ImportValidationError("file-size");
  return parseWorkBuddyTranscript(await file.text());
}
