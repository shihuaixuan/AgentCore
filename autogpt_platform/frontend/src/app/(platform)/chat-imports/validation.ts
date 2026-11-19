import { z } from "zod";

export const MAX_SELECTION = 25;
const MAX_BODY_BYTES = 4 * 1024 * 1024;
export const MAX_MESSAGES = 500;
export const MAX_QIANWEN_PAIRS = MAX_MESSAGES / 2;

function boundedText(max: number) {
  return z.string().refine(function withinLimit(value) {
    return (
      value.length <= max * 2 &&
      value.trim().length > 0 &&
      !value.includes("\0") &&
      !/[\uD800-\uDFFF]/u.test(value) &&
      (value.length <= max || Array.from(value).length <= max)
    );
  });
}

const messageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  text: boundedText(100_000),
  timestamp: z.string().datetime({ offset: true }).nullish(),
});

const conversationSchema = z.object({
  source: z.enum(["workbuddy", "qianwen", "qwenwork"]),
  source_id: z.string().nullish(),
  title: boundedText(200),
  messages: z.array(messageSchema).min(1).max(MAX_MESSAGES),
});

const nativeConversationSchema = conversationSchema.extend({
  source: z.enum(["workbuddy", "qwenwork"]),
  source_id: z
    .string()
    .length(64)
    .regex(/^[0-9a-f]{64}$/),
});
const workBuddySchema = nativeConversationSchema.extend({
  source: z.literal("workbuddy"),
});

const bundleSchema = z.object({
  version: z.literal(1),
  conversations: z.array(z.unknown()),
});

export type ImportConversation = z.infer<typeof conversationSchema>;
export type ImportMessage = z.infer<typeof messageSchema>;
export type QianwenPair = { question: string; answer: string };
export type AttachmentReference = { path: string; cwd?: string };
export type NativeChatDraft = {
  conversation: ImportConversation;
  references: AttachmentReference[];
  cwd?: string;
};

export class ImportValidationError extends Error {
  constructor(
    readonly code:
      | "json"
      | "bundle"
      | "files"
      | "file-size"
      | "file-type"
      | "transcript"
      | "secure-context"
      | "conversation"
      | "manual"
      | "selection"
      | "hosted-upload-size"
      | "archive-destination"
      | "qwenwork-folder"
      | "qwenwork-database"
      | "qwenwork-db-size"
      | "qwenwork-busy"
      | "qwenwork-reader"
      | "qwenwork-db-attachment"
      | "size",
    readonly entry?: number,
  ) {
    super(code);
  }
}

export function validateNativeConversation(input: unknown) {
  const result = nativeConversationSchema.safeParse(input);
  if (!result.success) throw new ImportValidationError("conversation");
  return result.data;
}

export function validateWorkBuddyConversation(input: unknown, entry?: number) {
  const result = workBuddySchema.safeParse(input);
  if (!result.success) throw new ImportValidationError("conversation", entry);
  return result.data;
}

export function parseWorkBuddyBundle(text: string) {
  let input: unknown;
  try {
    input = JSON.parse(text.replace(/^\uFEFF/, ""));
  } catch {
    throw new ImportValidationError("json");
  }
  const bundle = bundleSchema.safeParse(input);
  if (!bundle.success) throw new ImportValidationError("bundle");

  return bundle.data.conversations.map(function parseEntry(entry, index) {
    return validateWorkBuddyConversation(entry, index + 1);
  });
}

export function makeQianwenConversation(title: string, pairs: QianwenPair[]) {
  const result = conversationSchema.safeParse({
    source: "qianwen",
    title,
    messages: pairs.flatMap(({ question, answer }) => [
      { role: "user", text: question },
      { role: "assistant", text: answer },
    ]),
  });
  if (!result.success) throw new ImportValidationError("manual");
  return result.data;
}

export function encodeImport(conversations: ImportConversation[]) {
  if (!conversations.length || conversations.length > MAX_SELECTION) {
    throw new ImportValidationError("selection");
  }
  const body = JSON.stringify({ conversations });
  if (new TextEncoder().encode(body).byteLength > MAX_BODY_BYTES) {
    throw new ImportValidationError("size");
  }
  return body;
}
