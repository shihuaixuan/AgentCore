import { z } from "zod";
import { nativeSourceID } from "./nativeSourceID";
import { workBuddyContent } from "./workbuddyContent";
import { collectWorkBuddyHistory } from "./workbuddyHistory";
import {
  encodeImport,
  ImportValidationError,
  MAX_MESSAGES,
  parseWorkBuddyBundle,
  validateWorkBuddyConversation,
  type AttachmentReference,
  type ImportMessage,
  type NativeChatDraft,
} from "./validation";

const MAX_FILES = 25;
export const MAX_WORKBUDDY_FILE_BYTES = 32 * 1024 * 1024;
const timestampSchema = z.string().datetime({ offset: true });

export async function readWorkBuddyFiles(files: File[]) {
  if (files.length > MAX_FILES) throw new ImportValidationError("files");
  const totalBytes = files.reduce((total, file) => total + file.size, 0);
  if (totalBytes > MAX_WORKBUDDY_FILE_BYTES)
    throw new ImportValidationError("file-size");

  const entries: NativeChatDraft[] = [];
  for (const file of files) {
    if (/\.jsonl$/i.test(file.name)) {
      entries.push(await readWorkBuddyTranscriptDraftFile(file));
    } else if (/\.json$/i.test(file.name)) {
      entries.push(
        ...parseWorkBuddyBundle(await file.text()).map((conversation) => ({
          conversation,
          references: [],
        })),
      );
    } else {
      throw new ImportValidationError("file-type");
    }
  }
  return entries;
}

export function parseWorkBuddyTranscript(text: string) {
  return parseWorkBuddyDraft(text).conversation;
}

export function isWorkBuddyTranscriptFile(file: File) {
  const directories = (file.webkitRelativePath || "")
    .split(/[\\/]/)
    .slice(0, -1);
  return (
    /\.jsonl$/i.test(file.name) &&
    !/^agent-/i.test(file.name) &&
    !directories.some((part) =>
      /^(?:subagents|tool-results|workflows)$/i.test(part),
    )
  );
}

export async function readWorkBuddyTranscriptDraftFile(
  file: File,
): Promise<NativeChatDraft> {
  if (!isWorkBuddyTranscriptFile(file))
    throw new ImportValidationError("file-type");
  if (file.size > MAX_WORKBUDDY_FILE_BYTES)
    throw new ImportValidationError("file-size");
  return parseWorkBuddyDraft(await file.text());
}

function parseWorkBuddyDraft(text: string): NativeChatDraft {
  const history = collectWorkBuddyHistory(text);
  const { sessionID, title, candidates, speakers } = history;
  let { omittedUnattributed } = history;
  const ordered: ImportMessage[] = [];
  const references = new Map<string, AttachmentReference>();
  let cwd: string | undefined;
  for (const item of candidates) {
    const attribution = speakers.attribution(item.speaker);
    if (attribution !== "public") {
      if (attribution === "uncertain") omittedUnattributed = true;
      continue;
    }
    const { role } = item.speaker;
    const { text, paths, uncertain } = workBuddyContent(
      item.content,
      item.speaker,
    );
    omittedUnattributed ||= uncertain;
    if (text) {
      const timestamp = normalizeTimestamp(item.timestamp);
      ordered.push({ role, text, ...(timestamp ? { timestamp } : {}) });
      if (ordered.length > MAX_MESSAGES)
        throw new ImportValidationError("transcript");
    }
    if (text || paths.length) cwd ??= item.cwd;
    for (const path of paths) {
      if (references.size >= 100) break;
      references.set(JSON.stringify([path, item.cwd]), { path, cwd: item.cwd });
    }
  }
  if (!ordered.length) throw new ImportValidationError("transcript");
  const heading =
    title || ordered.find(({ role }) => role === "user")?.text || "WorkBuddy";
  const conversation = validateWorkBuddyConversation({
    source: "workbuddy",
    source_id: nativeSourceID("workbuddy", sessionID),
    title: Array.from(heading.trim()).slice(0, 200).join(""),
    messages: ordered,
  });
  encodeImport([conversation]);
  return {
    conversation,
    references: [...references.values()],
    cwd,
    ...(omittedUnattributed ? { omittedUnattributed } : {}),
  };
}

function normalizeTimestamp(value: unknown): string | undefined {
  if (typeof value === "string" && timestampSchema.safeParse(value).success) {
    const utcYear = new Date(value).getUTCFullYear();
    return utcYear >= 1 && utcYear <= 9999 ? value : undefined;
  }
  if (typeof value === "number" && Number.isFinite(value)) {
    const date = new Date(
      Math.abs(value) < 100_000_000_000 ? value * 1000 : value,
    );
    const utcYear = date.getUTCFullYear();
    if (utcYear >= 1 && utcYear <= 9999) return date.toISOString();
  }
}
