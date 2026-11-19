"use client";

import { useContext, useState } from "react";
import { useTranslation } from "@/lib/i18n/LanguageProvider";
import { getDefaultAssistantTitle } from "@/services/experts/default-assistant";

import { parseTurnPause } from "../../turnPause";
import { CopilotChatActionsContext } from "../CopilotChatActionsProvider/useCopilotChatActions";
import { CurrentPauseContext } from "./CurrentPauseContext";
import { useStopHere } from "./useStopHere";

interface Args {
  data: unknown;
  /** Stable for the pause across reloads when it is its stored row's. */
  pauseKey: string;
  /** The pause is a stored row, so its key outlives a reload. */
  isStoredRow: boolean;
}

export function useTurnPausedCard({ data, pauseKey, isStoredRow }: Args) {
  const { t, locale } = useTranslation();
  const actions = useContext(CopilotChatActionsContext);
  const current = useContext(CurrentPauseContext);
  const pause = parseTurnPause(data);
  const sessionId = actions?.sessionId ?? null;
  const [isPickedUp, setIsPickedUp] = useState(false);
  const isTracked = current !== undefined;
  const isCurrent = data != null && data === current;
  const { isStopped, stop } = useStopHere({
    sessionId,
    pause,
    pauseKey,
    isStoredRow,
    isCurrent,
  });
  // Acting needs a chat to act on and a way to follow the turn the server
  // starts; the share viewer and the side panels have neither.
  const canAct = Boolean(sessionId && actions?.onBackendTurn);

  function followTurn() {
    setIsPickedUp(true);
    actions?.onBackendTurn?.();
  }

  return {
    pause,
    sessionId: canAct ? sessionId : null,
    assistantName: actions?.assistantName ?? getDefaultAssistantTitle(locale),
    isLive: isCurrent && canAct && !isStopped && !isPickedUp,
    note: isStopped
      ? t("Stopped here", "在此停止")
      : isPickedUp || (isTracked && !isCurrent)
        ? t("Picked back up", "已恢复继续")
        : null,
    stop,
    followTurn,
  };
}
