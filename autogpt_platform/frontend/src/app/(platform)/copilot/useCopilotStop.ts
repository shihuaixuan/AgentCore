import { postV2CancelSessionTask } from "@/app/api/__generated__/endpoints/chat/chat";
import { toast } from "@/components/molecules/Toast/use-toast";
import { useTranslation } from "@/lib/i18n/LanguageProvider";
import type { UIMessage } from "ai";
import { resolveInProgressTools } from "./helpers";

/**
 * User-visible marker appended to the last assistant message so the UI
 * renders a "You manually stopped this chat" row the moment the SSE is
 * aborted. The backend writes the same marker to the DB, so a subsequent
 * reload shows the same state. Must match `COPILOT_ERROR_PREFIX` in
 * `ChatMessagesContainer/helpers.ts`.
 */
export const CANCELLED_MARKER = "[__COPILOT_ERROR_f7a1__] Operation cancelled";

interface UseCopilotStopArgs {
  sessionId: string | null;
  /** Aborts the stream and marks the turn stopped on screen, synchronously,
   *  so the UI reflects the click before the cancel POST returns. */
  stopStream: () => void;
  /** Flipped to `true` so the stream's onError/onFinish callbacks don't
   *  misinterpret the resulting AbortError as a disconnect + reconnect. */
  isUserStoppingRef: React.MutableRefObject<boolean>;
  /** State setter mirroring ``isUserStoppingRef`` — drives the UI so the
   *  stop-button UX flips immediately instead of waiting for AI SDK's
   *  ``status`` to transition away from "streaming" on abort. */
  setIsUserStopping: (value: boolean) => void;
}

/**
 * Build the `stop` handler for the chat stream:
 *   1. flag the stop as user-initiated (so onError/onFinish don't reconnect)
 *   2. abort the stream and mark the turn stopped, for instant UI feedback
 *   3. asynchronously tell the backend executor to actually stop the task,
 *      surfacing a toast when the cancel was published but not yet
 *      confirmed (the task should stop shortly) or failed outright.
 */
export function useCopilotStop({
  sessionId,
  stopStream,
  isUserStoppingRef,
  setIsUserStopping,
}: UseCopilotStopArgs) {
  const { t } = useTranslation();
  async function stop() {
    isUserStoppingRef.current = true;
    setIsUserStopping(true);
    stopStream();

    if (!sessionId) return;
    try {
      const res = await postV2CancelSessionTask(sessionId);
      if (isCancellationPending(res)) {
        toast({
          title: t("Stop may take a moment", "停止任务可能需要一点时间"),
          description: t(
            "The cancel was sent but not yet confirmed. The task should stop shortly.",
            "已发送取消请求，但尚未确认。任务应会很快停止。",
          ),
        });
      }
    } catch {
      toast({
        title: t("Could not stop the task", "无法停止任务"),
        description: t(
          "The task may still be running in the background.",
          "任务可能仍在后台运行。",
        ),
        variant: "destructive",
      });
    }
  }

  return stop;
}

function isCancellationPending(
  res: Awaited<ReturnType<typeof postV2CancelSessionTask>>,
) {
  return (
    res.status === 200 &&
    "reason" in res.data &&
    res.data.reason === "cancel_published_not_confirmed"
  );
}

/**
 * The AI SDK path's `stopStream`: abort the SDK's fetch, cancel open tools
 * and append the marker to the last assistant message.
 */
export function sdkStopStream(
  sdkStop: () => void,
  setMessages: (updater: (prev: UIMessage[]) => UIMessage[]) => void,
) {
  return () => {
    try {
      sdkStop();
    } catch {
      // sdkStop throws if no fetch is in flight — the user-stop flag
      // already flipped, so the UI reflects the intent either way.
    }
    setMessages(markMessagesStopped);
  };
}

function markMessagesStopped(prev: UIMessage[]): UIMessage[] {
  const resolved = resolveInProgressTools(prev, "cancelled");
  const last = resolved[resolved.length - 1];
  if (last?.role !== "assistant") return resolved;
  return [
    ...resolved.slice(0, -1),
    {
      ...last,
      parts: [...last.parts, { type: "text" as const, text: CANCELLED_MARKER }],
    },
  ];
}
