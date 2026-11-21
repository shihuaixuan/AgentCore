import { ImportValidationError } from "./validation";

export type Fields = Record<string, unknown>;
export type Attribution = "public" | "nested" | "internal" | "unknown";

export function record(value: unknown): Fields | undefined {
  if (value && typeof value === "object" && !Array.isArray(value))
    return value as Fields;
}

export function readFields(raw: unknown) {
  if (typeof raw !== "string") return;
  try {
    return record(JSON.parse(raw));
  } catch {
    return;
  }
}

export function requireNativeChat(raw: unknown, execution: unknown) {
  const ext = readFields(raw);
  if (
    !ext ||
    execution !== 0 ||
    ext.agentExecutionOwner != null ||
    ext.isCronChat
  )
    throw new ImportValidationError("conversation");
}

export function nested(fields: Fields) {
  return Boolean(
    fields.parentToolUseId ||
      fields.parent_tool_use_id ||
      fields.parent_agent_id ||
      fields.teamName ||
      fields.isSidechain ||
      fields.isMeta ||
      fields.isSynthetic,
  );
}

export function rowAttribution(
  role: "user" | "assistant",
  meta: Fields | undefined,
  sessionID: unknown,
  messageID: unknown,
  input: unknown,
  legacy: boolean,
  requireSession = false,
): Attribution {
  if (!meta) return "unknown";
  if (nested(meta)) return "nested";
  if (
    meta.isSystemNotification ||
    meta.hiddenControlCommand ||
    meta.inputSubmitted === false ||
    (role === "user" &&
      ["draft", "queued", "cancelled"].includes(String(meta.status))) ||
    record(meta.promptApproval)?.blocked ||
    meta.source === "cron-execution" ||
    input === "internal"
  )
    return "internal";
  if (
    (requireSession && meta.sessionId == null) ||
    (meta.sessionId != null &&
      sessionID != null &&
      meta.sessionId !== sessionID) ||
    (meta.assistantMessageId != null &&
      messageID != null &&
      meta.assistantMessageId !== messageID) ||
    (meta.source != null && meta.source !== "sdk-projection") ||
    input === "unknown"
  )
    return "unknown";
  if (role === "assistant" || legacy || input === "direct") return "public";
  return meta.source === "sdk-projection" &&
    typeof meta.sdkUserMessageUuid === "string" &&
    meta.sdkUserMessageUuid.trim()
    ? "public"
    : "unknown";
}

export function trackPublicTurns(legacy: boolean) {
  let current: Attribution = legacy ? "public" : "unknown";
  let currentRequest: string | undefined;
  const requests = new Map<string, Attribution>();
  function user(owner: Attribution, request: unknown) {
    if (owner !== "nested") {
      current = owner;
      currentRequest = typeof request === "string" ? request : undefined;
    }
    if (typeof request !== "string" || !request) return;
    const previous = requests.get(request);
    requests.set(request, previous && previous !== owner ? "unknown" : owner);
  }
  function assistant(request: unknown) {
    if (typeof request !== "string" || !request) return current;
    return requests.get(request) ?? (currentRequest ? "unknown" : current);
  }
  return { user, assistant };
}
