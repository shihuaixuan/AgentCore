import { nested, record, type Fields } from "./qwenWorkAttribution";
import { qwenWorkClarificationReader } from "./qwenWorkClarifications";
import { qwenWorkUserBody } from "./qwenWorkUserParts";
import { ImportValidationError } from "./validation";
import { normalizeLocalPath } from "./workbuddyAttachments";

function readParts(raw: unknown): Fields[] {
  if (typeof raw !== "string") throw new ImportValidationError("conversation");
  let blocks: unknown;
  try {
    blocks = JSON.parse(raw);
  } catch {
    throw new ImportValidationError("conversation");
  }
  if (!Array.isArray(blocks)) throw new ImportValidationError("conversation");
  return blocks
    .map(record)
    .filter((part): part is Fields => part !== undefined);
}

function isFile(part: Fields) {
  return (
    part.type === "file-content" ||
    part.type === "data-file" ||
    part.type === "data-image"
  );
}

function collectReferences(parts: Fields[], references: Set<string>) {
  for (const part of parts) {
    if (references.size >= 100) return;
    if (!isFile(part)) continue;
    const path =
      part.type === "file-content"
        ? part.filePath
        : record(part.data)?.filePath;
    const normalized = typeof path === "string" && normalizeLocalPath(path);
    if (normalized) references.add(normalized);
  }
}

function isRootPart(part: Fields) {
  return !nested(part) && !nested(record(part.metadata) ?? {});
}

function textContent(part: Fields) {
  if (typeof part.text !== "string")
    throw new ImportValidationError("conversation");
  return part.text;
}

function isAnswerPart(part: Fields) {
  return (
    part.type === "text" &&
    !record(part.metadata)?.planKind &&
    !(typeof part.id === "string" && part.id.includes(":")) &&
    (part.state == null || part.state === "done")
  );
}

function selectedAnswer(parts: Fields[], meta: Fields, legacy: boolean) {
  const candidates = parts.filter(
    (part) => isRootPart(part) && isAnswerPart(part),
  );
  const plain = parts.every((part) => isAnswerPart(part) || isFile(part));
  if (meta.status != null && meta.status !== "completed")
    return {
      selected: [],
      omitted:
        !["streaming", "failed", "cancelled"].includes(String(meta.status)) &&
        candidates.length > 0,
    };
  if (
    (meta.resultSubtype != null && meta.resultSubtype !== "success") ||
    meta.taskStatus === "failed" ||
    meta.taskStatus === "cancelled"
  )
    return { selected: [], omitted: false };

  if (meta.finalTextId != null || meta.finalTextSource != null) {
    const id = meta.finalTextId;
    const matches = parts.filter((part) => part.id === id);
    const confirmed =
      meta.finalTextSource == null || meta.finalTextSource === "explicit";
    const solitary =
      meta.finalTextSource === "client-last-text" &&
      plain &&
      candidates.length === 1;
    if (
      typeof id === "string" &&
      id.trim() &&
      matches.length === 1 &&
      candidates.includes(matches[0]) &&
      (confirmed || solitary)
    )
      return { selected: matches, omitted: false };
    return { selected: [], omitted: true };
  }
  if (
    plain &&
    (legacy || (candidates.length === 1 && meta.status === "completed"))
  )
    return { selected: candidates, omitted: false };
  return { selected: [], omitted: candidates.length > 0 };
}

type PublicTurn = { role: "user" | "assistant"; text: string };

export type QwenWorkProjection = {
  text: string;
  omitted: boolean;
  userInput?: boolean;
  turns?: PublicTurn[];
};

export function collectQwenWorkParts(
  raw: unknown,
  references: Set<string>,
  role: "user" | "assistant",
  meta: Fields,
  legacy: boolean,
): QwenWorkProjection {
  const parts = readParts(raw);
  const root = parts.filter(isRootPart);
  if (role === "user") {
    const { text, omitted, files } = qwenWorkUserBody(root);
    if (text.trim() === "/compact")
      return { text: "", omitted: false, userInput: false };
    if (files) collectReferences(root, references);
    const hasFile = root.some(isFile);
    return {
      text,
      omitted: omitted || (!files && hasFile),
      userInput: Boolean(text.trim()) || (files && hasFile),
    };
  }
  const answer = selectedAnswer(parts, meta, legacy);
  const selected = new Set(answer.selected);
  let omitted = answer.omitted;
  const turns: PublicTurn[] = [];
  const readClarification = qwenWorkClarificationReader(parts);
  for (const part of root) {
    if (selected.has(part)) {
      const text = textContent(part);
      if (text.trim()) turns.push({ role: "assistant", text });
    } else if (part.type === "tool-AskUserQuestion") {
      const clarification = readClarification(part);
      if (clarification.prompt)
        turns.push({ role: "assistant", text: clarification.prompt });
      if (clarification.reply)
        turns.push({ role: "user", text: clarification.reply });
      omitted ||= clarification.omitted;
    }
  }
  if (root.some(isFile)) {
    if (
      selected.size &&
      root.every((part) => selected.has(part) || isFile(part))
    )
      collectReferences(root, references);
    else omitted = true;
  }
  const assistant = turns.filter((turn) => turn.role === "assistant");
  return {
    text: assistant.map((turn) => turn.text).join("\n"),
    omitted,
    ...(assistant.length !== turns.length ? { turns } : {}),
  };
}

export function qwenWorkTimestamp(value: unknown) {
  if (typeof value !== "number" || !Number.isFinite(value) || value <= 0)
    return;
  const date = new Date(value < 100_000_000_000 ? value * 1000 : value);
  const year = date.getUTCFullYear();
  if (year >= 1 && year <= 9999) return date.toISOString();
}
