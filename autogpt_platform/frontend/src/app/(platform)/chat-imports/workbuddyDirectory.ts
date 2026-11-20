import type { ImportConversation } from "./validation";
import {
  isWorkBuddyTranscriptFile,
  readWorkBuddyTranscriptDraftFile,
} from "./workbuddyTranscript";

export { readWorkBuddyTranscriptDraftFile };

export function findWorkBuddyTranscripts(files: File[]): File[] {
  return files.filter(isWorkBuddyTranscriptFile);
}

export async function readWorkBuddyTranscriptFile(
  file: File,
): Promise<ImportConversation> {
  return (await readWorkBuddyTranscriptDraftFile(file)).conversation;
}
