import { getGetV2GetSessionQueryOptions } from "@/app/api/__generated__/endpoints/chat/chat";
import type { SessionDetailResponse } from "@/app/api/__generated__/models/sessionDetailResponse";
import { useTranslation } from "@/lib/i18n/LanguageProvider";
import { useQueryClient } from "@tanstack/react-query";
import type { UIMessage } from "ai";
import { useLayoutEffect, useRef, useState } from "react";
import { hasVisibleAssistantContent } from "../../helpers";
import { convertChatSessionMessagesToUiMessages } from "../../helpers/convertChatSessionToUiMessages";
import {
  createAssistantRunJoiner,
  createTailRenderer,
  statsOfAssistantRuns,
} from "../../stream/renderTail";
import {
  createTranscriptRuntime,
  type RuntimeSnapshot,
} from "../../stream/turnRuntime";
import { turnStart } from "../../stream/turnTail";
import { isSessionLive } from "../ToolChain/subSessionStatus";

function useTranscriptSnapshot(session: SessionDetailResponse) {
  const queryClient = useQueryClient();
  const sessionID = session.id;
  const reader = useRef<ReturnType<typeof createTranscriptRuntime> | null>(
    null,
  );
  const [snapshot, setSnapshot] = useState<RuntimeSnapshot | null>(null);

  useLayoutEffect(() => {
    const runtime = createTranscriptRuntime(sessionID, async () => {
      const response = await queryClient.fetchQuery(
        getGetV2GetSessionQueryOptions(sessionID, undefined, {
          query: { staleTime: 0, retry: false },
        }),
      );
      return response.status === 200 ? response.data : null;
    });
    reader.current = runtime;
    const unsubscribe = runtime.subscribe(() =>
      setSnapshot(runtime.getSnapshot()),
    );
    return () => {
      unsubscribe();
      runtime.dispose();
      reader.current = null;
    };
  }, [queryClient, sessionID]);

  useLayoutEffect(() => {
    reader.current?.observe(session);
  }, [queryClient, session]);

  return snapshot;
}

function transcriptCut(snapshot: RuntimeSnapshot | null) {
  const first = snapshot?.segments[0];
  if (!snapshot || snapshot.error) return null;
  if (first?.kind === "turn") {
    return turnStart(snapshot.segments, snapshot.ownedFrom, first, []);
  }
  return snapshot.ownedFrom;
}

export function useSubSessionTranscript(
  session: SessionDetailResponse,
  prompt: string | null,
) {
  const snapshot = useTranscriptSnapshot(session);
  const [renderTail] = useState(() => createTailRenderer(session.id));
  const [joinRuns] = useState(() => createAssistantRunJoiner());
  const { t } = useTranslation();
  const isLive =
    isSessionLive(session) ||
    snapshot?.phase === "live" ||
    snapshot?.phase === "resuming";
  const pending = isLive || !!session.background_pending;
  const cut = transcriptCut(snapshot);
  const history = convertChatSessionMessagesToUiMessages(
    session.id,
    session.messages.filter(
      (row) =>
        cut === null || typeof row.sequence !== "number" || row.sequence < cut,
    ),
    {
      isComplete: !isLive,
      activeTurnStartedAt: session.active_stream?.started_at,
    },
  );
  const tail = snapshot && !snapshot.error ? renderTail(snapshot) : null;
  const rows = [...history.messages, ...(tail?.messages ?? [])];
  if (
    pending &&
    prompt?.trim() &&
    !rows.some((message) => message.role === "user")
  ) {
    const task: UIMessage = {
      id: `${session.id}-pending-task`,
      role: "user",
      parts: [{ type: "text", text: prompt }],
    };
    rows.unshift(task);
  }
  const messages = joinRuns(rows);
  const stats = statsOfAssistantRuns(
    rows,
    new Map([...history.stats, ...(tail?.stats ?? [])]),
  );
  const notice = pending
    ? snapshot?.error
      ? t(
          "Live updates unavailable. Showing saved messages.",
          "暂时无法接收实时更新，正在同步已保存的消息。",
        )
      : snapshot?.notice === "offline"
        ? t("Offline — waiting for the network…", "已离线 — 正在等待网络恢复…")
        : snapshot?.notice
          ? t("Syncing the conversation…", "正在同步子智能体会话…")
          : session.chat_status === "queued" && !session.active_stream
            ? t("Task queued", "任务排队中")
            : !hasVisibleAssistantContent(messages)
              ? t("Waiting for the sub-agent's reply…", "正在等待子智能体回复…")
              : null
    : null;
  return { messages, stats, notice, status: isLive ? "streaming" : "ready" };
}
