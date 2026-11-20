import { ImportValidationError } from "./validation";

export type Fields = Record<string, unknown>;

export function fields(value: unknown): Fields | undefined {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Fields;
  }
}

const childMarkers = [
  "isSubAgent",
  "isSubagent",
  "isTeamMember",
  "isSidechain",
  "codebuddy.ai/isSubagent",
  "parentToolUseId",
  "parent_tool_use_id",
  "parentToolCallId",
  "parentSessionId",
  "parentConversationId",
  "parentSubagentId",
  "subagent",
  "subagentContext",
  "subagentSession",
  "subagentRootSessionId",
  "teamContext",
];

export function isDelegated(record: Fields) {
  return [record, fields(record.providerData), fields(record._meta)].some(
    (data) =>
      data &&
      (childMarkers.some((key) => Boolean(data[key])) ||
        data.multitaskRole === "worker"),
  );
}

const privateFlags = [
  "skipRun",
  "isMeta",
  "isAdditionalData",
  "isCompactInternal",
  "isCompacted",
  "isSummary",
  "compactType",
  "injectedHistory",
  "isPartialAborted",
  "turnAborted",
  "teammateMessage",
  "scheduledTaskTrigger",
  "goalStatus",
  "__codebuddyAttachedContext",
  "modLog",
  "toolResult",
  "error",
];
const internalSpeakers = new Set([
  "compact",
  "contextSummary",
  "contentAnalyzer",
  "agentInstructions",
  "terminalTitleGenerator",
  "promptSuggestion",
  "summaryGenerator",
  "promptHookEvaluator",
  "insightsAnalyzer",
  "memorySelector",
  "autoModeClassifier",
  "viewImageDescriber",
  "securityReviewer",
]);

export function isInternal(record: Fields) {
  const data = fields(record.providerData);
  return [record, data].some(
    (part) =>
      part &&
      (privateFlags.some((key) => Boolean(part[key])) ||
        part.__codebuddyInitiator === "agent" ||
        part.staged ||
        part.isStaged ||
        part.draft ||
        part.isDraft ||
        (typeof part.agent === "string" && internalSpeakers.has(part.agent))),
  );
}

export type Speaker = {
  role: "user" | "assistant";
  agent?: string;
  request?: string;
  starts: boolean;
};

export function speakerOf(record: Fields): Speaker | undefined {
  const { role } = record;
  if (role !== "user" && role !== "assistant") return;
  const data = fields(record.providerData);
  if (record.providerData != null && !data) return;
  const agent = data?.agent;
  const request = data?.conversationRequestId;
  const starts = data?.startsNewUserRequest;
  const client = fields(fields(data?.clientMeta)?.["codebuddy.ai"]);
  const otherRoles = [data?.role, fields(record.message)?.role];
  if (
    otherRoles.some((other) => other !== undefined && other !== role) ||
    (record.agent !== undefined && record.agent !== agent) ||
    (agent !== undefined && (typeof agent !== "string" || !agent.trim())) ||
    (request !== undefined &&
      (typeof request !== "string" || !request.trim())) ||
    (starts !== undefined &&
      (role !== "user" || typeof starts !== "boolean")) ||
    (starts === false &&
      client?.queueOrigin !== "steer" &&
      data?.__codebuddyInitiator !== "user")
  )
    return;
  return { role, agent, request, starts: starts === true };
}

export class WorkBuddySpeakers {
  main?: string;
  delegated = false;
  private names = new Set<string>();
  private requests = new Map<string, string>();
  private current?: Speaker;
  private hasUser = false;

  observeMetadata(event: Fields) {
    const meta = fields(event.meta);
    if (!meta || isDelegated(event) || isDelegated(meta))
      throw new ImportValidationError("transcript");
    const main = meta["codebuddy.ai/mainAgent"];
    if (main !== undefined) {
      if (
        typeof main !== "string" ||
        !main.trim() ||
        (this.main && this.main !== main)
      ) {
        throw new ImportValidationError("transcript");
      }
      this.main = main;
      this.names.add(main);
    }
    if (meta.multitaskMode || meta.delegateMode) this.delegated = true;
  }

  observeName(agent: unknown) {
    if (typeof agent === "string" && agent) this.names.add(agent);
  }

  attribution(speaker: Speaker): "public" | "other" | "uncertain" {
    const { role, agent, request, starts } = speaker;
    if (role === "user") {
      this.hasUser = true;
      this.current = starts ? speaker : undefined;
      if (starts && request && agent) {
        const previous = this.requests.get(request);
        if (previous && previous !== agent)
          throw new ImportValidationError("transcript");
        this.requests.set(request, agent);
      }
    }
    if (!this.delegated && this.names.size <= 1) {
      return this.main || this.hasUser || !agent || agent === "cli"
        ? "public"
        : "uncertain";
    }

    const correlated = request
      ? this.requests.get(request)
      : this.current?.agent;
    if (this.main && correlated && this.main !== correlated) return "uncertain";
    const main = this.main ?? correlated;
    if (main && agent) return main === agent ? "public" : "other";
    if (role === "user" && starts) return "public";
    return "uncertain";
  }
}
