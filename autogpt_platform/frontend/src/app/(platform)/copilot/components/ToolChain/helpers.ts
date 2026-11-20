import type { ToolUIPart } from "ai";
import type { Locale } from "@/lib/i18n/locale";
import {
  getBlockDisplayName,
  type DisplayToolPart,
} from "../../helpers/toolDisplay";
import type { MessagePart } from "../ChatMessagesContainer/helpers";
import { EXPERT_ONBOARDING_PART_TYPE } from "../ExpertOnboardingCard/helpers";
import { isFeedbackCardPart } from "../../tools/FeedbackPrompts/helpers";
import { isQuestionTool } from "../QuestionDock/helpers";
import {
  type ClarifyingQuestion,
  extractClarifyingQuestions,
} from "../../tools/clarifying-questions";
import {
  extractToolName,
  getAnimationText,
  getToolCategory,
} from "../../tools/GenericTool/helpers";
import { capabilityTargetRow, capabilityTargetToolName } from "./capabilityRow";
import { type ChainCategory, getCatalogLabel } from "./toolCatalog";
import type { HeldRowInfo } from "./heldRow";
import { heldAskText, heldToolName } from "./heldRow";
import { asObject, integrationIconSrc } from "./resultHelpers";
import { getCategorySummary } from "./chainSummary";
import {
  childSessionID,
  SUB_SESSION_RESULT_TOOL,
  subSessionTargetRow,
} from "./subSessionRows";

export type ChainRowState = "running" | "done" | "error";

export interface ChainRow {
  key: string;
  category: ChainCategory;
  text: string;
  state: ChainRowState;
  detail?: string;
  providerIconSrc?: string;
  tool?: string;
  input?: unknown;
  output?: unknown;
  subSessionID?: string;
  reasoningText?: string;
  requiresAction?: boolean;
  /** The row's user-facing work (connectors, inputs, questions) renders in
   *  the card below the chain — the row is hidden but stays mounted so the
   *  card keeps its registration. */
  lifted?: boolean;
  /** A later row shows this same sub-session's card — this one keeps its
   *  row line but renders no card, so one delegation never stacks
   *  duplicate cards down the chain. */
  supersededSubSession?: boolean;
  /** A call the action gate held: whether it waits, ran or was turned down. */
  held?: HeldRowInfo;
  /** A lookup that found nothing, which the label already says. */
  emptyResult?: boolean;
}

/** Delegate → poll → poll chains reference the same sub-session; only the
 *  LAST row per RUN keeps its card, earlier ones are marked superseded. A
 *  fresh delegation starts a new run, so the row holding the previous run's
 *  response stays readable instead of dropping out of the transcript. */
export function markSupersededSubSessionRows(rows: ChainRow[]): ChainRow[] {
  const supersededKeys = new Set<string>();
  const latest = new Map<
    string,
    { key: string; output: Record<string, unknown> }
  >();
  const updatedOutputs = new Map<string, Record<string, unknown>>();
  for (const row of rows) {
    const target = subSessionTargetRow(row);
    const output = target && asObject(target.output);
    if (
      !target ||
      !output ||
      row.state !== "done" ||
      typeof output.status !== "string"
    )
      continue;
    const sessionID = childSessionID(output);
    if (!sessionID) continue;
    const previous = latest.get(sessionID);
    if (previous && target.tool === SUB_SESSION_RESULT_TOOL) {
      supersededKeys.add(previous.key);
      const merged = {
        ...output,
        expert: output.expert ?? previous.output.expert,
        background_task_id:
          output.background_task_id ?? previous.output.background_task_id,
      };
      updatedOutputs.set(row.key, merged);
      latest.set(sessionID, { key: row.key, output: merged });
    } else {
      latest.set(sessionID, { key: row.key, output });
    }
  }
  if (supersededKeys.size === 0) return rows;
  return rows.map((row) => {
    if (supersededKeys.has(row.key))
      return { ...row, supersededSubSession: true };
    const output = updatedOutputs.get(row.key);
    return output ? { ...row, output } : row;
  });
}

const ACTION_RESPONSE_TYPES = new Set([
  "setup_requirements",
  "review_required",
  "approval_required",
  "need_login",
  "trigger_config_required",
  "suggested_goal",
]);

const BLOCK_ACTION_TOOLS = new Set([
  "run_block",
  "continue_run_block",
  "run_capability",
  "resume_capability",
]);

function actionLabel(
  toolName: string,
  tool: ToolUIPart,
  locale: Locale,
): string | null {
  const chinese = locale === "zh-CN";
  const output = tool.output;
  const data = asObject(output);
  if (!data) return null;
  if (typeof data.type !== "string" || !ACTION_RESPONSE_TYPES.has(data.type)) {
    return null;
  }
  const isBlock = BLOCK_ACTION_TOOLS.has(toolName);
  if (data.type === "setup_requirements") {
    const setup =
      data.setup_info && typeof data.setup_info === "object"
        ? (data.setup_info as Record<string, unknown>)
        : null;
    const name = isBlock
      ? getBlockDisplayName(tool.title, output)
      : setup?.agent_name;
    return typeof name === "string" && name.trim()
      ? chinese
        ? `连接 ${name.trim()} 以继续`
        : `Connect ${name.trim()} to continue`
      : chinese
        ? "完成设置以继续"
        : "Complete setup to continue";
  }
  if (data.type === "review_required") {
    const name = isBlock
      ? getBlockDisplayName(tool.title, output)
      : data.block_name;
    return typeof name === "string" && name.trim()
      ? chinese
        ? `审核 ${name.trim()}`
        : `Review ${name.trim()}`
      : chinese
        ? "审核此操作"
        : "Review this action";
  }
  if (data.type === "approval_required")
    return heldAskText(data, heldToolName(data, toolName), locale);
  if (data.type === "suggested_goal")
    return chinese ? "审核建议的目标" : "Review the suggested goal";
  return typeof data.message === "string" && data.message.trim()
    ? data.message.trim()
    : chinese
      ? "需要你采取操作"
      : "Action required";
}

/** Setup-requirements rows whose card registers with the chain and renders
 *  outside it — including run_mcp_tool, whose hidden MCPSetupCard registers
 *  an MCP row into the same connectors table. Only rows whose card registers
 *  a ChainActionEntry may be lifted: a lifted row renders off-screen, so a
 *  card that never registers would disappear entirely. */
export function isLiftedSetupRow(row: ChainRow): boolean {
  const data = asObject(row.output);
  if (!data) return false;
  return data.type === "setup_requirements" && !!asObject(data.setup_info);
}

/** The questions a settled row asked once the user has moved past them. They
 *  render under the chain, where their card was, so collapsing the chain
 *  cannot hide what the user was asked. */
export function getAskedQuestions(row: ChainRow): ClarifyingQuestion[] {
  if (row.state !== "done" || row.lifted) return [];
  if (!isQuestionTool(row.tool, row.output)) return [];
  return extractClarifyingQuestions(row);
}

function getProviderIconSrc(tool: ToolUIPart): string | undefined {
  for (const source of [tool.input, tool.output]) {
    if (source && typeof source === "object" && "provider" in source) {
      const provider = (source as { provider: unknown }).provider;
      if (typeof provider === "string" && provider.trim()) {
        return integrationIconSrc(provider) ?? undefined;
      }
    }
  }
  return undefined;
}

// The compaction row owns its own progress bar and payoff frame — folding
// it into a chain would bury both behind a collapsed "summarized context".
export const COMPACTION_PART_TYPE = "tool-context_compaction";

export const SOUL_CHANGE_TOOLS = new Set([
  "update_expert_soul",
  "confirm_expert_soul_update",
]);

// Hiring, raising or updating an expert, or editing its Soul, is the user's
// call, not a step the model worked through — the card renders as its own
// message part so the approval never sits inside a chain that collapses on
// top of it.
export const EXPERT_CHANGE_TOOLS = new Set([
  "hire_expert",
  "raise_expert",
  "update_expert",
  "confirm_expert_change",
  ...SOUL_CHANGE_TOOLS,
]);

export function isExpertChangePart(part: MessagePart): boolean {
  if (!part.type.startsWith("tool-")) return false;
  if (EXPERT_CHANGE_TOOLS.has(part.type.slice("tool-".length))) return true;
  const target = capabilityTargetToolName(
    part.type,
    "input" in part ? part.input : undefined,
  );
  return target !== null && EXPERT_CHANGE_TOOLS.has(target);
}

export function isChainPart(part: MessagePart): boolean {
  if (
    part.type === COMPACTION_PART_TYPE ||
    part.type === EXPERT_ONBOARDING_PART_TYPE ||
    isFeedbackCardPart(part) ||
    isExpertChangePart(part)
  ) {
    return false;
  }
  return part.type === "reasoning" || part.type.startsWith("tool-");
}

// Short assistant text sandwiched between tool calls is progress narration
// ("Now searching for hotels."), not an answer — fold it into the chain so
// back-to-back tool calls collapse into one group instead of splitting on
// every sentence.
const NARRATION_MAX_CHARS = 200;

function narrationText(part: MessagePart): string | null {
  if (part.type !== "text") return null;
  const text = typeof part.text === "string" ? part.text.trim() : "";
  if (!text || text.length > NARRATION_MAX_CHARS) return null;
  return text;
}

/** Chats saved before the engines named a dispatched tool after itself store
 *  `run_capability(id: "tool:<name>")`; those rows are labelled as the tool
 *  that ran. A `connect` call only checks sign-in, so it keeps its own. */
function getRowCatalogLabel(
  row: ChainRow,
  context: { displayName: unknown; output: unknown },
  locale: Locale,
) {
  const target = capabilityTargetRow(row);
  const viaDispatch =
    target.tool && target !== row && asObject(target.input)?.connect !== true
      ? getCatalogLabel(target.tool, target.input, row.state, context, locale)
      : null;
  return (
    viaDispatch ??
    getCatalogLabel(row.tool ?? "", row.input, row.state, context, locale)
  );
}

export function toChainRow(
  part: MessagePart,
  index: number,
  locale: Locale = "en",
): ChainRow | null {
  const narration = narrationText(part);
  if (narration !== null) {
    return {
      key: `narration-${index}`,
      category: "narration",
      text: narration,
      state: "done",
    };
  }
  if (part.type === "reasoning") {
    const isStreaming = "state" in part && part.state === "streaming";
    // A settled reasoning part with nothing in it is a "Thought it through"
    // row over an empty panel — the model never actually wrote any.
    const hasText =
      "text" in part && typeof part.text === "string" && !!part.text.trim();
    if (!isStreaming && !hasText) return null;
    return {
      key: `reasoning-${index}`,
      category: "reasoning",
      text:
        locale === "zh-CN"
          ? isStreaming
            ? "正在思考…"
            : "思考过程"
          : isStreaming
            ? "Thinking…"
            : "Thought",
      state: isStreaming ? "running" : "done",
      reasoningText:
        "text" in part && typeof part.text === "string" ? part.text : undefined,
    };
  }
  if (part.type.startsWith("tool-")) {
    const tool = part as DisplayToolPart;
    const toolName = extractToolName(tool);
    const state: ChainRowState =
      tool.state === "output-error"
        ? "error"
        : tool.state === "output-available"
          ? "done"
          : "running";
    const detail =
      state === "error" && typeof tool.errorText === "string"
        ? tool.errorText
        : undefined;

    // While the input JSON is still streaming, labels/icons must not read
    // it — partial subjects re-trigger the swap animation on every delta.
    const isInputStreaming = tool.state === "input-streaming";
    const stableTool = isInputStreaming
      ? ({ ...tool, input: undefined } as ToolUIPart)
      : tool;

    const providerIconSrc = getProviderIconSrc(stableTool);
    const requiredActionLabel = actionLabel(toolName, tool, locale);

    const data = {
      tool: toolName,
      input: stableTool.input,
      output: tool.output,
      ...(tool.subSessionID ? { subSessionID: tool.subSessionID } : {}),
    };

    const catalogLabel = getRowCatalogLabel(
      { key: tool.toolCallId, category: "other", text: "", state, ...data },
      { displayName: tool.title, output: tool.output },
      locale,
    );
    if (catalogLabel) {
      return {
        key: tool.toolCallId,
        ...catalogLabel,
        text: requiredActionLabel ?? catalogLabel.text,
        state,
        detail,
        providerIconSrc,
        requiresAction: requiredActionLabel !== null,
        ...data,
      };
    }

    const category = getToolCategory(toolName);
    return {
      key: tool.toolCallId,
      category,
      text: getAnimationText(stableTool, category, locale),
      state,
      detail,
      providerIconSrc,
      requiresAction: requiredActionLabel !== null,
      ...data,
    };
  }
  return null;
}

// Streaming → live label of the running row; settled → verb-chain like
// "Updated tasks, searched the web, ran commands".
export function getChainHeading(
  rows: ChainRow[],
  isStreaming: boolean,
  locale: Locale = "en",
): string {
  if (isStreaming) {
    const running = rows.findLast((r) => r.state === "running");
    if (running) return running.text;
  }
  const error = rows.findLast((row) => row.state === "error");
  if (error) return error.detail ?? error.text;
  const requiredAction = rows.findLast(
    (row) => row.requiresAction && !row.lifted,
  );
  if (requiredAction) return requiredAction.text;

  const phrases: string[] = [];
  const seenPhrases = new Set<string>();
  for (const row of rows) {
    if (row.category === "narration") continue;
    const phrase = getCategorySummary(row.category, locale);
    if (!seenPhrases.has(phrase)) {
      seenPhrases.add(phrase);
      phrases.push(phrase);
    }
    if (phrases.length === 3) break;
  }
  const joined =
    phrases.join(locale === "zh-CN" ? "，" : ", ") ||
    (locale === "zh-CN" ? "处理中…" : "Working…");
  return joined.charAt(0).toUpperCase() + joined.slice(1);
}

export type ChainSegment =
  | { kind: "chain"; parts: MessagePart[]; index: number }
  // Back-to-back expert changes (one per hire/raise call) render as one
  // group so a whole new team pages instead of stacking down the message.
  | { kind: "experts"; parts: MessagePart[]; index: number }
  | { kind: "part"; part: MessagePart; index: number };

export function buildChainSegments(
  parts: MessagePart[],
  isChainable: (part: MessagePart) => boolean = isChainPart,
): ChainSegment[] {
  const segments: ChainSegment[] = [];
  let chain: Extract<ChainSegment, { kind: "chain" }> | null = null;

  const hasChainableAhead = (from: number): boolean => {
    for (let i = from; i < parts.length; i++) {
      const part = parts[i];
      if (part.type === "step-start") continue;
      if (isChainable(part)) return true;
      if (narrationText(part) !== null) continue;
      return false;
    }
    return false;
  };

  parts.forEach((part, index) => {
    if (part.type === "step-start") return;
    if (isExpertChangePart(part)) {
      chain = null;
      const last = segments[segments.length - 1];
      if (last?.kind === "experts") last.parts.push(part);
      else segments.push({ kind: "experts", parts: [part], index });
      return;
    }
    if (isChainable(part)) {
      if (!chain) {
        chain = { kind: "chain", parts: [], index };
        segments.push(chain);
      }
      chain.parts.push(part);
      return;
    }
    // Fold short progress narration into the surrounding chain, but only
    // once a later tool call proves it was narration and not the answer.
    // Folding optimistically while streaming made every trailing answer
    // render inside the chain and then jump out to regular message text —
    // either when it outgrew NARRATION_MAX_CHARS or when the stream ended.
    if (chain && narrationText(part) !== null && hasChainableAhead(index + 1)) {
      chain.parts.push(part);
      return;
    }
    chain = null;
    segments.push({ kind: "part", part, index });
  });

  return segments;
}

/** A tool call whose result has not landed. Whatever it needs from the user
 *  has not been asked for yet. A call paused on human-in-the-loop approval
 *  is equally unresolved — only a denial or an output ends it. */
export function isToolCallPending(part: MessagePart): boolean {
  if (!part.type.startsWith("tool-")) return false;
  const state = (part as ToolUIPart).state;
  return (
    state === "input-streaming" ||
    state === "input-available" ||
    state === "approval-requested" ||
    state === "approval-responded"
  );
}
