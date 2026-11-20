import { ImportValidationError } from "./validation";
import { WorkBuddyOrder } from "./workbuddyOrder";
import {
  fields,
  isDelegated,
  isInternal,
  speakerOf,
  WorkBuddySpeakers,
  type Fields,
  type Speaker,
} from "./workbuddyAttribution";

type Candidate = {
  speaker: Speaker;
  content: unknown;
  cwd?: string;
  timestamp: unknown;
};

const drafts = new Set([
  "pending",
  "in_progress",
  "incomplete",
  "draft",
  "staged",
  "failed",
  "cancelled",
]);
const modelItems = new Set([
  "function_call",
  "function_call_result",
  "function_call_output",
  "reasoning",
]);

export function collectWorkBuddyHistory(text: string) {
  const speakers = new WorkBuddySpeakers();
  const candidates = new Map<string, Candidate>();
  const withheld = new Set<string>();
  const order = new WorkBuddyOrder();
  let sessionID: string | undefined;
  let title = "";
  let omittedUnattributed = false;

  for (const [index, line] of text
    .replace(/^\uFEFF/, "")
    .split("\n")
    .entries()) {
    if (!line.trim()) continue;
    const fail = () => new ImportValidationError("transcript", index + 1);
    const event = readEvent(line, index + 1);
    if (event.type !== "session-meta" && isDelegated(event)) {
      speakers.delegated = true;
      continue;
    }
    if (event.sessionId !== undefined) {
      const id = event.sessionId;
      if (
        typeof id !== "string" ||
        !/^[a-zA-Z0-9_-]{1,128}$/.test(id) ||
        /^agent-/i.test(id) ||
        (sessionID && id !== sessionID)
      )
        throw fail();
      sessionID = id;
    }
    if (event.type === "session-meta") {
      speakers.observeMetadata(event);
      continue;
    }
    if (
      event.type === "resend-fork-notice" ||
      fields(event.providerData)?.contentFilterNotice
    )
      throw fail();
    if (event.type === "function_call" && event.name === "Agent")
      speakers.delegated = true;
    if (
      event.type === "message" &&
      event.status !== undefined &&
      event.status !== "completed"
    ) {
      if (typeof event.status !== "string" || !drafts.has(event.status))
        omittedUnattributed = true;
      continue;
    }
    if (event.type === "message" || modelItems.has(event.type))
      order.add(event);
    if (isInternal(event)) {
      if (event.type === "message" && typeof event.id === "string") {
        if (candidates.has(event.id)) throw fail();
        withheld.add(event.id);
      }
      continue;
    }
    const data = fields(event.providerData);
    if (modelItems.has(event.type)) speakers.observeName(data?.agent);
    if (
      event.type === "ai-title" &&
      event.sessionId &&
      typeof event.aiTitle === "string" &&
      !data?.agent
    ) {
      title = event.aiTitle.trim() || title;
    }
    if (event.type !== "message") {
      if (event.type === "assistant" || event.type === "user")
        omittedUnattributed = true;
      continue;
    }
    const speaker = speakerOf(event);
    if (!speaker) {
      if (
        event.role !== "system" &&
        event.role !== "tool" &&
        event.role !== "developer"
      )
        omittedUnattributed = true;
      if (typeof event.id === "string") {
        if (candidates.has(event.id)) throw fail();
        withheld.add(event.id);
      }
      continue;
    }
    if (
      !event.sessionId ||
      typeof event.id !== "string" ||
      !event.id ||
      withheld.has(event.id)
    )
      throw fail();
    const previous = candidates.get(event.id)?.speaker;
    if (
      previous &&
      (previous.role !== speaker.role ||
        previous.agent !== speaker.agent ||
        previous.request !== speaker.request)
    )
      throw fail();
    candidates.set(event.id, {
      speaker,
      content: event.content,
      timestamp: event.timestamp,
      cwd:
        typeof event.cwd === "string" && event.cwd.length <= 1024
          ? event.cwd
          : undefined,
    });
  }
  if (!sessionID) throw new ImportValidationError("transcript");
  for (const { speaker } of candidates.values())
    speakers.observeName(speaker.agent);
  return {
    sessionID,
    title,
    candidates: order.replay(candidates),
    speakers,
    omittedUnattributed,
  };
}

function readEvent(
  line: string,
  lineNumber: number,
): Fields & { type: string } {
  let value: unknown;
  try {
    value = JSON.parse(line);
  } catch {
    throw new ImportValidationError("transcript", lineNumber);
  }
  const event = fields(value);
  if (!event || typeof event.type !== "string")
    throw new ImportValidationError("transcript", lineNumber);
  return { ...event, type: event.type };
}
