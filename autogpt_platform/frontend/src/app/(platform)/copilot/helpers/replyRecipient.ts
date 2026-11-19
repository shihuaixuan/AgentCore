import type { UIMessage } from "ai";

export interface ReplyRecipient {
  id: string | null;
  name: string;
  avatar_url: string | null;
}

export const REPLY_RECIPIENT_PART_TYPE = "data-reply-recipient";

export function parseReplyRecipient(value: unknown): ReplyRecipient | null {
  if (!value || typeof value !== "object") return null;
  const { id, name, avatar_url } = value as Record<string, unknown>;
  if (
    (id !== null && typeof id !== "string") ||
    typeof name !== "string" ||
    !name.trim() ||
    (avatar_url !== null && typeof avatar_url !== "string")
  ) {
    return null;
  }
  return { id, name, avatar_url };
}

export function getReplyRecipient(metadata: unknown): ReplyRecipient | null {
  return metadata &&
    typeof metadata === "object" &&
    "reply_recipient" in metadata
    ? parseReplyRecipient(metadata.reply_recipient)
    : null;
}

export function getMessageReplyRecipient(
  message: UIMessage,
): ReplyRecipient | null {
  if (message.role !== "assistant") return null;
  const saved = getReplyRecipient(message.metadata);
  if (saved) return saved;
  for (const part of message.parts) {
    if (part.type !== REPLY_RECIPIENT_PART_TYPE || !("data" in part)) continue;
    const streamed = parseReplyRecipient(part.data);
    if (streamed) return streamed;
  }
  return null;
}

export function sameReplyRecipient(
  previous: ReplyRecipient | null,
  next: ReplyRecipient | null,
): boolean {
  if (!previous || !next) return previous === next;
  return (
    previous.id === next.id &&
    previous.name === next.name &&
    previous.avatar_url === next.avatar_url
  );
}

export function replyAuthorKey(message: UIMessage): string | null {
  const recipient = getMessageReplyRecipient(message);
  return recipient
    ? JSON.stringify([recipient.id, recipient.name, recipient.avatar_url])
    : null;
}
