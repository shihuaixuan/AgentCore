"use client";

import { useTranslation } from "@/lib/i18n/LanguageProvider";
import type { Locale } from "@/lib/i18n/locale";

import { useGetV2GetSession } from "@/app/api/__generated__/endpoints/chat/chat";
import type { SessionDetailResponse } from "@/app/api/__generated__/models/sessionDetailResponse";
import { ExpertAvatar } from "@/components/molecules/ExpertAvatar/ExpertAvatar";
import { cn } from "@/lib/utils";
import type { ToolUIPart } from "ai";
import { useEffect, useState } from "react";
import {
  getAnimationText,
  getToolCategory,
} from "../../tools/GenericTool/helpers";
import { useExpertMap } from "../../useExpertMap";
import { extractToolOutputsFromRaw } from "../../helpers/convertChatSessionToUiMessages";
import type { ChainRow } from "./helpers";
import { CARD, StatusPill } from "./ResultCards";
import { asObject, str } from "./resultHelpers";
import { RowIcon } from "./RowIcon";
import { SwapText } from "./SwapText";
import { getCatalogLabel } from "./toolCatalog";
import {
  getBackgroundOutcome,
  isSessionLive,
  isSessionPending,
} from "./subSessionStatus";
import { Text } from "@/components/atoms/Text/Text";

interface Props {
  subSessionId: string;
  active: boolean;
  background?: boolean;
}

const POLL_MS = 3000;
const MAX_STEPS = 3;
// Live polling stops after this long on screen — a marathon sub-session is
// better followed via its "Open sub-session" link than by pinging the API
// every few seconds indefinitely. The card keeps its last snapshot.
const POLL_CAP_MS = 5 * 60_000;

interface LiveStep {
  name: string;
  input: unknown;
  displayName?: unknown;
  output?: unknown;
}

/** The delegate's work, live inside the parent chain: its recent tool calls
 *  and latest words, polled while the sub-session runs so the user watches
 *  progress without opening the session. The parent tool output stays
 *  ``running`` forever, so liveness comes from the polled session itself —
 *  once it goes idle, polling stops and the last state stays up as the
 *  delegate's final answer. */
export function SubSessionLive({
  subSessionId,
  active,
  background = false,
}: Props) {
  const { t, locale } = useTranslation();
  const { session, isError, isPaused } = useLiveSubSession(
    subSessionId,
    active,
    background,
  );
  if (!active) return null;

  const turn = session ? collectCurrentTurn(session) : null;
  const recent = turn?.steps.slice(-MAX_STEPS) ?? [];
  const latestText = turn?.latestText ?? null;
  const notice = isError
    ? t("Couldn't load live updates", "无法加载实时更新")
    : isPaused
      ? t("Live updates paused", "实时更新已暂停")
      : null;
  if (!notice && recent.length === 0 && !latestText) return null;

  const isLive = !!session && isSessionLive(session) && !isPaused && !isError;
  const rows = recent.map((step, i) =>
    toMiniRow(step, i, isLive && i === recent.length - 1, locale),
  );

  return (
    <div className="mt-2 border-t border-separator pt-2.5 pl-1">
      <LiveSteps rows={rows} />
      {latestText && (
        <p className="mt-1.5 line-clamp-3 text-body leading-relaxed text-foreground-secondary">
          {latestText}
        </p>
      )}
      {notice && (
        <Text variant="small" tone="secondary" className="mt-1.5">
          {notice}
        </Text>
      )}
    </div>
  );
}

/** The polled sub-session plus the two states that used to render as
 *  nothing at all: a failed fetch, and the poll cap expiring while the run
 *  is still live. Both stop the polling, so both have to be visible —
 *  otherwise a dead card is indistinguishable from a working one. */
function useLiveSubSession(
  subSessionId: string,
  active: boolean,
  background = false,
) {
  // Background work records its outcome durably, so its card follows it to
  // the end; only a foreground delegation gives up after the cap.
  const [isCapped, setIsCapped] = useState(false);
  useEffect(
    function stopPollingAfterCap() {
      if (!active || background) return;
      const timer = setTimeout(() => setIsCapped(true), POLL_CAP_MS);
      return () => clearTimeout(timer);
    },
    [active, background],
  );
  const { data, isError } = useGetV2GetSession(subSessionId, undefined, {
    query: {
      enabled: active && !!subSessionId,
      refetchInterval: (query) => {
        if (query.state.status === "error" || isCapped) return false;
        const raw = query.state.data;
        const polled = raw && raw.status === 200 ? raw.data : null;
        return !polled || isSessionPending(polled, background)
          ? POLL_MS
          : false;
      },
      select: (res) => (res.status === 200 ? res.data : null),
    },
  });
  const session = data ?? null;
  return {
    session,
    isError,
    // A capped poll on a finished session is not "paused" — the last
    // snapshot IS the final answer, so there is nothing left to watch.
    isPaused: isCapped && (!session || isSessionPending(session, background)),
  };
}

function LiveSteps({ rows }: { rows: ChainRow[] }) {
  return rows.map((row, i) => {
    const isLastRow = i === rows.length - 1;
    return (
      <div key={row.key} className="flex items-stretch gap-2.5">
        <div className="flex w-6 flex-col items-center">
          <div className="flex size-6 shrink-0 items-center justify-center rounded-full bg-surface-hover">
            <RowIcon row={row} />
          </div>
          {!isLastRow && <div className="w-px flex-1 bg-surface-active" />}
        </div>
        <div className={cn("min-w-0 flex-1 pt-0.5", !isLastRow && "pb-2.5")}>
          <SwapText
            text={row.text}
            shimmer={row.state === "running"}
            className="max-w-full text-body leading-5 text-foreground-secondary"
          />
        </div>
      </div>
    );
  });
}

/** A re-delegation reuses the same sub-session, so only the CURRENT turn
 *  (everything after the last user message) belongs to this card — the full
 *  history would replay the previous delegation's final answer here. */
function collectCurrentTurn(session: SessionDetailResponse) {
  const allMessages = Array.isArray(session.messages) ? session.messages : [];
  const lastUserIndex = allMessages.findLastIndex((m) => m.role === "user");
  const messages =
    lastUserIndex === -1 ? allMessages : allMessages.slice(lastUserIndex + 1);
  const steps: LiveStep[] = [];
  const outputs = extractToolOutputsFromRaw(messages);
  let latestText: string | null = null;
  for (const msg of messages) {
    const toolCalls = Array.isArray(msg.tool_calls) ? msg.tool_calls : [];
    for (const rawCall of toolCalls) {
      if (!rawCall || typeof rawCall !== "object") continue;
      const call = rawCall as {
        id?: unknown;
        display_name?: unknown;
        function?: { name?: unknown; arguments?: unknown };
      };
      const name = String(call.function?.name ?? "").trim();
      if (name)
        steps.push({
          name,
          input: parseArguments(call.function?.arguments),
          displayName: call.display_name,
          output:
            typeof call.id === "string" ? outputs.get(call.id) : undefined,
        });
    }
    if (
      msg.role === "assistant" &&
      typeof msg.content === "string" &&
      msg.content.trim()
    ) {
      latestText = msg.content.trim();
    }
  }
  return { steps, latestText };
}

/** Dress a polled tool call as a ChainRow so the delegate's steps reuse the
 *  main chain's icons and labels instead of raw tool names. */
function toMiniRow(
  step: LiveStep,
  index: number,
  running: boolean,
  locale: Locale,
): ChainRow {
  const state = running ? "running" : "done";
  const catalog = getCatalogLabel(
    step.name,
    step.input,
    state,
    {
      displayName: step.displayName,
      output: step.output,
    },
    locale,
  );
  const category = catalog?.category ?? getToolCategory(step.name);
  const text =
    catalog?.text ??
    getAnimationText(
      {
        type: `tool-${step.name}`,
        state: running ? "input-available" : "output-available",
        input: step.input,
        toolCallId: `live-${index}`,
      } as ToolUIPart,
      getToolCategory(step.name),
      locale,
    );
  return {
    key: `live-${step.name}-${index}`,
    category,
    text,
    state,
    tool: step.name,
    input: step.input,
  };
}

/** A blocking call has no confirmed child session until its tool output lands. */
interface PendingCardProps {
  input: unknown;
  minimal?: boolean;
  readOnly?: boolean;
}

export function SubSessionPendingCard({
  input,
  minimal = false,
  readOnly = false,
}: PendingCardProps) {
  const { t } = useTranslation();
  const args = asObject(input) ?? {};
  const inputExpertId = str(args, "expert_id");
  const prompt = str(args, "prompt");
  const { expertsById } = useExpertMap(!readOnly && !!inputExpertId);
  const expert =
    !readOnly && inputExpertId ? expertsById.get(inputExpertId) : undefined;
  const name =
    expert?.name ??
    (inputExpertId ? t("Expert", "专家") : t("Sub-agent", "子智能体"));

  return (
    <div className={cn(CARD, "w-full rounded-2xl p-2.5")}>
      <div className="flex items-center gap-2.5">
        <ExpertAvatar
          name={name}
          avatarUrl={expert?.avatarUrl ?? null}
          color={expert?.color}
          size={28}
        />
        <Text
          variant="body-medium-tight"
          tone="emphasis"
          className="min-w-0 flex-1 truncate"
        >
          {name}
          {expert?.role && (
            <span className="ml-1.5 font-normal text-foreground-subtle">
              {expert.role}
            </span>
          )}
        </Text>
        <StatusPill status="running" className="text-body" />
      </div>
      {!minimal && prompt && (
        <p className="mt-1.5 line-clamp-2 pl-9 text-body text-foreground-tertiary">
          {prompt}
        </p>
      )}
    </div>
  );
}

/** A sub-session tool output freezes the status it had when the tool
 *  returned — a "running" card would say running forever after the work
 *  lands, and a "queued" one would say queued after it started. While the
 *  frozen status is running/queued, read the status off the polled session
 *  instead: queued while it waits for a slot, running once it runs, and
 *  completed once it goes idle.
 *
 *  Owns the poll through `useLiveSubSession` rather than piggybacking on a
 *  mounted live view: a minimal delegate card renders no live view, so this
 *  is the only thing left that can flip running → completed. On a full card
 *  it is the same query key, so the two share one poll. */
export function useSubSessionEffectiveStatus(
  subSessionId: string | null,
  status: string | null,
  background = false,
) {
  const stale = ["running", "queued"].includes(status?.toLowerCase() ?? "");
  const { session, isError, isPaused } = useLiveSubSession(
    subSessionId ?? "",
    stale && !!subSessionId,
    background,
  );
  if (!stale) return status;
  // The frozen status is only trustworthy while the poll can refute it. A
  // minimal card has no "Live updates paused" notice to fall back on, so a
  // dead poll has to show up in the pill or it reads as fact.
  if (isError || isPaused) return "unknown";
  if (!session) return status;
  if (background) {
    const outcome = getBackgroundOutcome(session);
    if (outcome) {
      return outcome === "timed_out" ? "timed out" : outcome;
    }
    const liveStatus = session.chat_status?.toLowerCase();
    return liveStatus === "running" || liveStatus === "queued"
      ? liveStatus
      : status;
  }
  return liveStatusOf(session);
}

function liveStatusOf(session: SessionDetailResponse) {
  if (session.active_stream) return "running";
  const status = session.chat_status?.toLowerCase();
  if (status === "running" || status === "queued") return status;
  return "completed";
}

function parseArguments(rawArguments: unknown): unknown {
  if (typeof rawArguments !== "string") return rawArguments ?? {};
  try {
    return JSON.parse(rawArguments);
  } catch {
    return {};
  }
}
