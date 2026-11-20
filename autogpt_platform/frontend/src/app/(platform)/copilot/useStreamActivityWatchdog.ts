import { useEffect } from "react";
import { STREAM_STALL_TIMEOUT_MS } from "./restoreConstants";
import { scheduleSilenceCheck } from "./streamSilenceTimer";

type UseChatStatus = "submitted" | "streaming" | "ready" | "error";

interface UseStreamActivityWatchdogArgs {
  sessionId: string | null;
  status: UseChatStatus;
  activityToken: string | number;
  wireTimeRemaining: (() => number) | undefined;
  isReconnectScheduled: boolean;
  isUserStoppingRef: React.MutableRefObject<boolean>;
  handleReconnectRef: React.MutableRefObject<() => void>;
}

export function useStreamActivityWatchdog({
  sessionId,
  status,
  activityToken,
  wireTimeRemaining,
  isReconnectScheduled,
  isUserStoppingRef,
  handleReconnectRef,
}: UseStreamActivityWatchdogArgs) {
  useEffect(() => {
    if (!sessionId || (status !== "streaming" && status !== "submitted"))
      return;
    if (isReconnectScheduled || isUserStoppingRef.current) return;

    return scheduleSilenceCheck(
      STREAM_STALL_TIMEOUT_MS,
      wireTimeRemaining,
      () => {
        if (!isUserStoppingRef.current) handleReconnectRef.current();
      },
    );
  }, [
    sessionId,
    status,
    activityToken,
    wireTimeRemaining,
    isReconnectScheduled,
    isUserStoppingRef,
    handleReconnectRef,
  ]);
}
