import type { SqlValue } from "sql.js";
import {
  nested,
  readFields,
  record,
  rowAttribution,
} from "./qwenWorkAttribution";

export function isBoundedTaskImport(extension: SqlValue) {
  const imported = record(readFields(extension)?.taskImport);
  return (
    imported?.boundedTranscriptRecovery === true &&
    imported.continuationMode === "bounded-projection"
  );
}

function isID(value: unknown): value is string {
  return typeof value === "string" && value.length <= 1024 && !!value.trim();
}

export function confirmedRecoverySession(
  rows: Iterable<SqlValue[]>,
  activeSession: SqlValue,
) {
  if (!isID(activeSession)) return;
  let original: string | undefined;
  let userConfirmed = false;
  let assistantConfirmed = false;
  for (const [, role, raw, active, messageID, input] of rows) {
    const meta = readFields(raw);
    if (!meta || active !== activeSession) return;
    const session = meta.sessionId;
    if (session == null || session === activeSession || nested(meta)) continue;
    if (role !== "user" && role !== "assistant") return;
    const owner = rowAttribution(role, meta, session, messageID, input, false);
    if (owner === "internal") continue;
    if (
      !isID(session) ||
      (original && original !== session) ||
      !isID(messageID) ||
      meta.source !== "sdk-projection" ||
      owner !== "public"
    )
      return;
    if (
      role === "user" &&
      (isID(meta.sdkUserMessageUuid) || input === "direct")
    )
      userConfirmed = true;
    else if (role === "assistant" && meta.assistantMessageId === messageID)
      assistantConfirmed = true;
    else return;
    original = session;
  }
  return userConfirmed && assistantConfirmed ? original : undefined;
}
