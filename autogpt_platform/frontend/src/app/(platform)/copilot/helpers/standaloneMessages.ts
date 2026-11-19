const STANDALONE_METADATA_KINDS = new Set([
  "expert_run",
  "scheduled_chat_notice",
]);

export function getStandaloneBubbleMetadata(
  metadata: unknown,
): Record<string, unknown> | null {
  if (!metadata || typeof metadata !== "object") return null;
  const fields = metadata as Record<string, unknown>;
  if (
    (typeof fields.kind === "string" &&
      STANDALONE_METADATA_KINDS.has(fields.kind)) ||
    fields.background_task_stage === "followup" ||
    "held_call" in fields ||
    "held_calls_answered" in fields
  ) {
    return fields;
  }
  return null;
}
