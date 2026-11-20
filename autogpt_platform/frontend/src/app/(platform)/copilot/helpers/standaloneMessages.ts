const IMPORTED_ARCHIVE_MESSAGE_KIND = "imported_archive_message";
const STANDALONE_METADATA_KINDS = new Set([
  "expert_run",
  "scheduled_chat_notice",
  IMPORTED_ARCHIVE_MESSAGE_KIND,
]);

export function getStandaloneBubbleMetadata(
  metadata: unknown,
): Record<string, unknown> | null {
  if (!metadata || typeof metadata !== "object") return null;
  const kind = (metadata as Record<string, unknown>).kind;
  return typeof kind === "string" && STANDALONE_METADATA_KINDS.has(kind)
    ? (metadata as Record<string, unknown>)
    : null;
}

export function isImportedArchiveMessage(metadata: unknown): boolean {
  return (
    getStandaloneBubbleMetadata(metadata)?.kind ===
    IMPORTED_ARCHIVE_MESSAGE_KIND
  );
}
