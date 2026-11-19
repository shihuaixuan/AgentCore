import { z } from "zod";
import { extractAttachmentPaths } from "./workbuddyAttachments";
import {
  encodeImport,
  ImportValidationError,
  MAX_MESSAGES,
  parseWorkBuddyBundle,
  validateWorkBuddyConversation,
  type ImportMessage,
  type ImportConversation,
} from "./validation";

const MAX_FILES = 25;
const MAX_FILE_BYTES = 32 * 1024 * 1024;
const eventSchema = z.object({
  type: z.string(),
  sessionId: z
    .string()
    .regex(/^[a-zA-Z0-9_-]{1,128}$/)
    .optional(),
  aiTitle: z.unknown(),
  id: z.unknown(),
  role: z.unknown(),
  content: z.unknown(),
  timestamp: z.unknown(),
  cwd: z.string().max(1024).optional().catch(undefined),
});
const contentSchema = z.object({ type: z.string(), text: z.string() });
const timestampSchema = z.string().datetime({ offset: true });

export async function readWorkBuddyFiles(files: File[]) {
  if (files.length > MAX_FILES) throw new ImportValidationError("files");
  const totalBytes = files.reduce((total, file) => total + file.size, 0);
  if (totalBytes > MAX_FILE_BYTES) throw new ImportValidationError("file-size");

  const entries: WorkBuddyDraftEntry[] = [];
  for (const file of files) {
    if (/\.jsonl$/i.test(file.name)) {
      entries.push(await parseWorkBuddyDraft(await file.text()));
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

export type AttachmentReference = { path: string; cwd?: string };
export type WorkBuddyDraftEntry = {
  conversation: ImportConversation;
  references: AttachmentReference[];
  cwd?: string;
};

export async function parseWorkBuddyTranscript(text: string) {
  return (await parseWorkBuddyDraft(text)).conversation;
}

export async function parseWorkBuddyDraft(
  text: string,
): Promise<WorkBuddyDraftEntry> {
  const messages = new Map<string, ImportMessage>();
  const references = new Map<string, AttachmentReference>();
  let cwd: string | undefined;
  let sessionID: string | undefined;
  let title = "";

  for (const [index, line] of text
    .replace(/^\uFEFF/, "")
    .split("\n")
    .entries()) {
    if (!line.trim()) continue;
    const event = readEvent(line, index + 1);
    if (event.sessionId && sessionID && event.sessionId !== sessionID) {
      throw new ImportValidationError("transcript", index + 1);
    }
    sessionID ??= event.sessionId;
    if (event.type === "ai-title" && typeof event.aiTitle === "string") {
      title = event.aiTitle.trim() || title;
    }
    const message = readMessage(event, index + 1);
    if (message) messages.set(...message);
    if (
      event.type === "message" &&
      (event.role === "user" || event.role === "assistant") &&
      Array.isArray(event.content)
    ) {
      cwd ??= event.cwd;
      for (const path of extractAttachmentPaths(event.content)) {
        if (references.size >= 100) break;
        references.set(JSON.stringify([path, event.cwd]), {
          path,
          cwd: event.cwd,
        });
      }
    }
    if (messages.size > MAX_MESSAGES)
      throw new ImportValidationError("transcript");
  }

  if (!sessionID || !messages.size)
    throw new ImportValidationError("transcript");
  const ordered = [...messages.values()];
  const heading =
    title || ordered.find(({ role }) => role === "user")?.text || "WorkBuddy";
  const conversation = validateWorkBuddyConversation({
    source: "workbuddy",
    source_id: await hashSession(sessionID),
    title: Array.from(heading.trim()).slice(0, 200).join(""),
    messages: ordered,
  });
  encodeImport([conversation]);
  return { conversation, references: [...references.values()], cwd };
}

function readEvent(line: string, lineNumber: number) {
  let input: unknown;
  try {
    input = JSON.parse(line);
  } catch {
    throw new ImportValidationError("transcript", lineNumber);
  }
  const result = eventSchema.safeParse(input);
  if (!result.success)
    throw new ImportValidationError("transcript", lineNumber);
  return result.data;
}

function readMessage(
  event: z.infer<typeof eventSchema>,
  lineNumber: number,
): [string, ImportMessage] | undefined {
  const { role, id, content } = event;
  if (event.type !== "message" || (role !== "user" && role !== "assistant"))
    return;
  if (
    !event.sessionId ||
    typeof id !== "string" ||
    !id ||
    !Array.isArray(content)
  ) {
    throw new ImportValidationError("transcript", lineNumber);
  }
  const blockType = role === "user" ? "input_text" : "output_text";
  const text = content
    .flatMap(function textBlock(block: unknown) {
      const parsed = contentSchema.safeParse(block);
      if (!parsed.success) return [];
      const { type, text } = parsed.data;
      return (type === blockType || type === "text") && text.trim()
        ? [text]
        : [];
    })
    .join("\n");
  if (!text) return;
  const timestamp = normalizeTimestamp(event.timestamp);
  return [id, { role, text, ...(timestamp ? { timestamp } : {}) }];
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

async function hashSession(sessionID: string) {
  if (!globalThis.crypto?.subtle)
    throw new ImportValidationError("secure-context");
  const data = new TextEncoder().encode(`workbuddy-jsonl-v1\0${sessionID}`);
  const hash = await globalThis.crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hash), (byte) =>
    byte.toString(16).padStart(2, "0"),
  ).join("");
}
