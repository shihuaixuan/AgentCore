import { z } from "zod";
import { ImportValidationError } from "./validation";
import { normalizeLocalPath } from "./workbuddyAttachments";

const blockSchema = z.object({
  type: z.string(),
  text: z.unknown(),
  filePath: z.unknown(),
  data: z.unknown(),
});
const fileDataSchema = z.object({ filePath: z.string() });

export function collectQwenWorkParts(raw: unknown, references: Set<string>) {
  if (typeof raw !== "string") throw new ImportValidationError("conversation");
  let blocks: unknown;
  try {
    blocks = JSON.parse(raw);
  } catch {
    throw new ImportValidationError("conversation");
  }
  if (!Array.isArray(blocks)) throw new ImportValidationError("conversation");

  const text: string[] = [];
  for (const block of blocks) {
    const parsed = blockSchema.safeParse(block);
    if (!parsed.success) continue;
    const { type, text: content, filePath, data } = parsed.data;
    if (type === "text") {
      if (typeof content !== "string")
        throw new ImportValidationError("conversation");
      if (content.trim()) text.push(content);
      continue;
    }
    if (references.size >= 100) continue;
    const path =
      type === "file-content"
        ? filePath
        : type === "data-file" || type === "data-image"
          ? fileDataSchema.safeParse(data).data?.filePath
          : undefined;
    if (typeof path !== "string") continue;
    const normalized = normalizeLocalPath(path);
    if (normalized) references.add(normalized);
  }
  return text.join("\n");
}

export function qwenWorkTimestamp(value: unknown) {
  if (typeof value !== "number" || !Number.isFinite(value) || value <= 0)
    return;
  const date = new Date(value < 100_000_000_000 ? value * 1000 : value);
  const year = date.getUTCFullYear();
  if (year >= 1 && year <= 9999) return date.toISOString();
}
