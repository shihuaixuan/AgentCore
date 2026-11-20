import { readWorkBuddyUserText } from "./nativeUserText";
import {
  fields,
  isDelegated,
  isInternal,
  type Fields,
  type Speaker,
} from "./workbuddyAttribution";
import { extractAttachmentPaths } from "./workbuddyAttachments";
import { ImportValidationError } from "./validation";

const internalEnvelope =
  /^ {0,3}<(teammate-message|task-notification|agent-notification|monitor-event|cb_summary|conversation_history_summary|local-command-stdout|local-command-stderr|image_local_path|turn_aborted)\b[^>]*>[\s\S]*<\/\1>\s*$/;

type Part =
  | { kind: "query" | "text"; text: string }
  | { kind: "file"; block: Fields };

export function workBuddyContent(content: unknown, { role, agent }: Speaker) {
  const blockType = role === "user" ? "input_text" : "output_text";
  const blocks =
    typeof content === "string"
      ? [{ type: blockType, text: content }]
      : content;
  if (!Array.isArray(blocks)) throw new ImportValidationError("transcript");
  const parts: Part[] = [];
  let uncertain = false;
  let hasHiddenText = false;
  for (const item of blocks) {
    const block = fields(item);
    if (!block || isDelegated(block) || isInternal(block)) continue;
    const data = fields(block.providerData);
    if (
      (block.role !== undefined && block.role !== role) ||
      (data?.role !== undefined && data.role !== role) ||
      (data?.agent !== undefined && data.agent !== agent)
    ) {
      uncertain = true;
      continue;
    }
    if (block.type === blockType || block.type === "text") {
      if (typeof block.text !== "string")
        throw new ImportValidationError("transcript");
      if (role === "assistant") {
        if (block.text.trim()) parts.push({ kind: "text", text: block.text });
      } else {
        const part = readWorkBuddyUserText(block.text);
        if (part.uncertain) return { text: "", paths: [], uncertain: true };
        if (
          part.text.trim() &&
          (part.query || !internalEnvelope.test(part.text))
        )
          parts.push({ kind: part.query ? "query" : "text", text: part.text });
        else if (block.text.trim()) hasHiddenText = true;
      }
    } else if (
      block.type === "file" ||
      block.type === "attachment" ||
      block.type === (role === "user" ? "input_file" : "output_file")
    )
      parts.push({ kind: "file", block });
  }

  const hasQuery = parts.some((part) => part.kind === "query");
  const publicParts = parts.filter((part) => !hasQuery || part.kind !== "text");
  uncertain ||= publicParts.length !== parts.length;
  const text = publicParts
    .flatMap((part) => (part.kind === "file" ? [] : [part.text]))
    .join("\n");
  const paths = extractAttachmentPaths(
    publicParts.flatMap((part) => {
      if (part.kind !== "file") return [{ type: blockType, text: part.text }];
      return !uncertain && (text || !hasHiddenText) ? [part.block] : [];
    }),
  );
  return { text, paths, uncertain };
}
