import { useCompleteBrainDumpGreeting } from "@/app/api/__generated__/endpoints/brain-dump/brain-dump";
import { toast } from "@/components/molecules/Toast/use-toast";
import { useStableCallback } from "@/hooks/useStableCallback";
import { useAuth } from "@/lib/auth/hooks/useAuth";
import { isValidUUID } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n/LanguageProvider";
import { trackBrainDump } from "@/services/onboarding/brain-dump-analytics";
import {
  peekGreetingDone,
  setGreetingDone,
  takeIntroAwaitingFollowup,
} from "@/services/onboarding/brain-dump-handoff";
import type { UIMessage } from "ai";
import { parseAsString, useQueryState } from "nuqs";
import { useEffect, useMemo, useState } from "react";
import { useCopilotStreamStore } from "./copilotStreamStore";
import {
  buildKickoffMessage,
  getKickoffAttemptToken,
  isKickoffMessage,
  shouldClearKickoffParam,
  type ExpertKickoffMetadata,
} from "./expertKickoff";
import {
  concatWithAssistantMerge,
  type TurnStatsMap,
} from "./helpers/convertChatSessionToUiMessages";
import {
  forgetHeldFollowUp,
  rememberHeldFollowUp,
  takeHeldFollowUps,
} from "./helpers/heldFollowUps";
import { stripReplayPrefix } from "./helpers/stripReplayPrefix";
import type { WorkspaceAttachment } from "./helpers/workspaceAttachments";
import { useCopilotUIStore } from "./store";
import { useChatSession } from "./useChatSession";
import { useCopilotNotifications } from "./useCopilotNotifications";
import { useCopilotPendingChips } from "./useCopilotPendingChips";
import { useCopilotRuntimeStream } from "./useCopilotRuntimeStream";
import { useCopilotStream } from "./useCopilotStream";
import { useManagedChatModels } from "./useManagedChatModels";
import { useExpertKickoff } from "./useExpertKickoff";
import { resolveExpertIdentity, useExpertMap } from "./useExpertMap";
import { useLoadMoreMessages } from "./useLoadMoreMessages";
import { recoverFailedDeferredSend, useSendMessage } from "./useSendMessage";
import { useSessionTitlePoll } from "./useSessionTitlePoll";
import { useSettleGate } from "./useSettleGate";
import { useWorkflowImportAutoSubmit } from "./useWorkflowImportAutoSubmit";

function trimVisibleMessagesForActiveRestore(messages: UIMessage[]) {
  const lastUserIndex = messages.findLastIndex(
    (message) => message.role === "user",
  );
  if (lastUserIndex === -1 || lastUserIndex === messages.length - 1) {
    return messages;
  }
  return messages.slice(0, lastUserIndex + 1);
}

function hasAssistantTail(messages: UIMessage[]) {
  const lastUserIndex = messages.findLastIndex(
    (message) => message.role === "user",
  );
  return lastUserIndex !== -1 && lastUserIndex < messages.length - 1;
}

function mergeTurnStats(
  pagedTurnStats: TurnStatsMap,
  currentTurnStats: TurnStatsMap | undefined,
) {
  const merged = new Map(pagedTurnStats);
  currentTurnStats?.forEach((v, k) => merged.set(k, v));
  return merged;
}

function readCachedSessionMessages(sessionId: string | null) {
  return sessionId
    ? useCopilotStreamStore.getState().getMessageSnapshot(sessionId)
    : [];
}

function getLatestKickoffAttemptToken(messages: UIMessage[]) {
  for (let index = messages.length - 1; index >= 0; index -= 1) {
    const attemptToken = getKickoffAttemptToken(messages[index]);
    if (attemptToken) return attemptToken;
  }
  return null;
}

function useCopilotPageSession() {
  const { user, isUserLoading, isLoggedIn } = useAuth();

  const [expertIdParam] = useQueryState("expertId", parseAsString);
  const [newThreadParam] = useQueryState("new", parseAsString);
  const expertId = expertIdParam;
  const [kickoffParam, setKickoffParam] = useQueryState(
    "kickoff",
    parseAsString,
  );
  const {
    expertsById,
    isLoadingExperts,
    hasExpertsSettled,
    hasExpertsErrored,
  } = useExpertMap();
  const validExpertIdParam =
    expertIdParam && isValidUUID(expertIdParam) ? expertIdParam : null;
  // Day one only fires for an expert we can still address. `onKickoff` writes
  // its opening turn through `sendNewMessage`, bypassing the `onSend` archive
  // guard, so a bogus id, an unreadable roster or a fired expert has to fall
  // through to the read-only thread rather than reach the kickoff path.
  const kickoffExpert = validExpertIdParam
    ? expertsById.get(validExpertIdParam)
    : undefined;
  const kickoffExpertId =
    hasExpertsSettled && kickoffExpert?.isArchived === false
      ? kickoffExpert.id
      : null;
  const isKickoffResolving =
    kickoffParam === "1" && validExpertIdParam !== null && isLoadingExperts;

  useEffect(() => {
    if (kickoffParam !== "1") return;
    if (!shouldClearKickoffParam(hasExpertsSettled, kickoffExpertId)) return;
    void setKickoffParam(null, { history: "replace" });
  }, [hasExpertsSettled, kickoffExpertId, kickoffParam, setKickoffParam]);

  const { modelID: managedModelID } = useManagedChatModels();
  const isDryRun = useCopilotUIStore((s) => s.isDryRun);
  const setInitialPrompt = useCopilotUIStore((s) => s.setInitialPrompt);
  const { mutate: completeGreeting } = useCompleteBrainDumpGreeting();

  const {
    sessionId,
    setSessionId,
    sessionView,
    sessionLlmAuthProvider,
    sessionLlmCredentialId,
    chatLlmAuthProvider,
    sessionExpertId,
    isAdoptingExpertSession,
    hydratedMessages,
    rawSessionMessages,
    historicalTurnStats,
    activeTurnStartMessageId,
    hasActiveStream,
    activeStreamStartedAt,
    hasMoreMessages,
    oldestSequence,
    isLoadingSession,
    isSessionError,
    isSessionNotFound,
    createSession,
    isCreatingSession,
    refetchSession,
    sessionDryRun,
    sessionChatStatus,
    sessionSentFrom,
    sessionAutopilotMode,
  } = useChatSession({
    dryRun: isDryRun,
    expertId,
    adoptLatestExpertThread: !newThreadParam,
    managedModelID,
  });

  // An open session owns its identity: the URL param only describes who the
  // NEXT session will address, and it is absent whenever a thread is reached
  // from global search, a bookmark or a shared link.
  const activeExpertId = sessionId ? sessionExpertId : expertId;
  const expertIdentity = resolveExpertIdentity(activeExpertId, expertsById, {
    settled: hasExpertsSettled,
    errored: hasExpertsErrored,
  });
  const isResolvingExpertIdentity = Boolean(
    activeExpertId && !hasExpertsSettled,
  );
  const isExpertSendLocked =
    isResolvingExpertIdentity || Boolean(expertIdentity?.isArchived);

  const streamArgs = {
    userId: user?.id ?? null,
    sessionId,
    sessionView,
    hydratedMessages,
    rawSessionMessages,
    sessionAuthProvider: sessionLlmAuthProvider,
    sessionCredentialId: sessionLlmCredentialId,
    activeTurnStartMessageId,
    activeTurnStartedAt: activeStreamStartedAt,
    hasActiveStream,
    refetchSession,
    copilotModel: { managedModelID },
  };
  return {
    user,
    isUserLoading,
    isLoggedIn,
    kickoffParam,
    setKickoffParam,
    kickoffExpertId,
    isKickoffResolving,
    setInitialPrompt,
    completeGreeting,
    sessionId,
    setSessionId,
    sessionExpertId,
    isAdoptingExpertSession,
    hydratedMessages,
    rawSessionMessages,
    historicalTurnStats,
    activeStreamStartedAt,
    hasMoreMessages,
    oldestSequence,
    isLoadingSession,
    isSessionError,
    isSessionNotFound,
    createSession,
    isCreatingSession,
    sessionDryRun,
    sessionChatStatus,
    sessionSentFrom,
    sessionAutopilotMode,
    chatLlmAuthProvider,
    expertIdentity,
    isResolvingExpertIdentity,
    isExpertSendLocked,
    streamArgs,
  };
}

type CopilotPageSession = ReturnType<typeof useCopilotPageSession>;
type CopilotPageStream =
  | ReturnType<typeof useCopilotStream>
  | ReturnType<typeof useCopilotRuntimeStream>;

function useCopilotPageChat(
  session: CopilotPageSession,
  stream: CopilotPageStream,
) {
  const { t, locale } = useTranslation();
  const reportHeldFollowUp = useStableCallback(() => {
    toast({
      title: t("Follow-up not sent", "后续消息未发送"),
      description: t(
        "You left the chat before it could go out. It's back in the composer.",
        "你在消息发出前离开了对话。消息已返回输入框。",
      ),
    });
  });
  const recoverDeferredSend = useStableCallback(
    (text: string, error: unknown) => {
      recoverFailedDeferredSend(text, [], error, locale);
    },
  );
  const {
    user,
    isUserLoading,
    isLoggedIn,
    kickoffParam,
    setKickoffParam,
    kickoffExpertId,
    isKickoffResolving,
    setInitialPrompt,
    completeGreeting,
    sessionId,
    setSessionId,
    sessionExpertId,
    isAdoptingExpertSession,
    hydratedMessages,
    rawSessionMessages,
    historicalTurnStats,
    activeStreamStartedAt,
    hasMoreMessages,
    oldestSequence,
    isLoadingSession,
    isSessionError,
    isSessionNotFound,
    createSession,
    isCreatingSession,
    sessionDryRun,
    sessionChatStatus,
    sessionSentFrom,
    sessionAutopilotMode,
    chatLlmAuthProvider,
    expertIdentity,
    isResolvingExpertIdentity,
    isExpertSendLocked,
  } = session;
  const runtimeStream = "appendLocalUserRows" in stream ? stream : null;
  const {
    followBackendTurn,
    messages: currentMessages,
    sendMessage,
    stop,
    status,
    error,
    isReconnecting,
    isFinishProbing,
    isRestoringActiveSession,
    isUserStoppingRef,
    isUserStopping,
    rateLimitMessage,
    platformLimitFailure,
    dismissRateLimit,
    providerLimit,
    dismissProviderLimit,
  } = stream;
  const kickoffAttemptToken = getLatestKickoffAttemptToken(currentMessages);

  const { pagedMessages, pagedTurnStats, hasMore, isLoadingMore, loadMore } =
    useLoadMoreMessages({
      sessionId,
      initialOldestSequence: runtimeStream
        ? runtimeStream.oldestSequence
        : oldestSequence,
      initialHasMore: hasMoreMessages,
      initialPageRawMessages: rawSessionMessages,
    });

  // Merge the older-pages and current-page stat maps; current-page (historical)
  // wins on overlap since it was persisted more recently.
  const currentTurnStats = runtimeStream
    ? runtimeStream.turnStats
    : historicalTurnStats;
  const turnStats = mergeTurnStats(pagedTurnStats, currentTurnStats);

  const isInflight =
    !isUserStopping && (status === "streaming" || status === "submitted");

  // Whether this tab has finished drawing the previous turn. The server's
  // turn can end well before the screen does. A follow-up waits here before
  // starting a separate turn on the selected model.
  const isLocalStreamSettled =
    !isInflight && !isFinishProbing && !isReconnecting;
  // A held follow-up learns whether the stream settled (send now) or the
  // hook went away first (the chat host unmounts on a chat switch and on
  // reload; the follow-up then stays in sessionStorage, see below).
  const {
    waitUntilSettled: waitForLocalSettle,
    claimTurn,
    releaseTurn,
  } = useSettleGate(isLocalStreamSettled);

  // Follow-ups waiting on the settle above. Shown as "Queued" chips beside
  // the backend-buffered ones, since from the user's side they are the same
  // thing. Mirrored into sessionStorage: this host is unmounted on a chat
  // switch and gone on a reload, and the only copy was in memory.
  const [heldFollowUps, setHeldFollowUps] = useState<string[]>([]);
  function holdFollowUp(forSessionId: string, text: string) {
    setHeldFollowUps((prev) => [...prev, text]);
    rememberHeldFollowUp(forSessionId, text);
  }
  function releaseFollowUp(forSessionId: string, text: string) {
    setHeldFollowUps((prev) => {
      const index = prev.indexOf(text);
      return index === -1 ? prev : prev.filter((_, i) => i !== index);
    });
    forgetHeldFollowUp(forSessionId, text);
  }
  useEffect(() => {
    if (!sessionId) return;
    const leftBehind = takeHeldFollowUps(sessionId);
    if (leftBehind.length === 0) return;
    setInitialPrompt(leftBehind.join("\n\n"));
    reportHeldFollowUp();
  }, [sessionId, setInitialPrompt, reportHeldFollowUp]);

  // Combine paginated messages with current page messages, merging consecutive
  // assistant UIMessages at the page boundary so reasoning + response parts
  // stay in a single bubble. Paged messages are older history prepended before
  // the current page.
  // Memoised on their inputs so the stripReplayPrefix memos below only re-run
  // when the messages actually change, not on every render once older pages
  // are loaded. The memos in this chain stay with the compiler on: effects
  // here and in the chat (queued chips, voice mode, the stream snapshot)
  // depend on the identity of the lists they produce.
  const rawMessages = useMemo(
    () => concatWithAssistantMerge(pagedMessages, currentMessages),
    [pagedMessages, currentMessages],
  );
  // Kept as a memo: this reads the stream store outside React, which rewrites
  // the snapshot as messages arrive; the restore view keeps the copy it read
  // when the chat opened.
  const cachedSessionMessages = useMemo(
    () => readCachedSessionMessages(sessionId),
    [sessionId],
  );
  const cachedRawMessages = useMemo(
    () => concatWithAssistantMerge(pagedMessages, cachedSessionMessages),
    [pagedMessages, cachedSessionMessages],
  );

  // Drop / trim assistant messages whose leading text is a replay of an
  // earlier assistant (Claude Agent SDK's `--resume` behaviour). See
  // helpers/stripReplayPrefix.ts for the three cases.
  const messages = useMemo(() => stripReplayPrefix(rawMessages), [rawMessages]);
  const cachedMessages = useMemo(
    () => stripReplayPrefix(cachedRawMessages),
    [cachedRawMessages],
  );
  // The runtime's restore state is a passive notice; it never trims the list.
  const restoreStatusMessage = runtimeStream?.restoreStatusMessage ?? null;
  const displayMessages = useMemo(() => {
    if (!isRestoringActiveSession || runtimeStream) return messages;
    if (hasAssistantTail(cachedMessages)) return cachedMessages;
    return trimVisibleMessagesForActiveRestore(messages);
  }, [isRestoringActiveSession, runtimeStream, messages, cachedMessages]);

  // Chip state machine (peek sync + auto-continue promotion + mid-turn poll)
  // lives in a dedicated hook so this component is just glue.
  const { queuedMessages } = useCopilotPendingChips({
    sessionId,
    status,
    messages,
    ...("setMessages" in stream
      ? { setMessages: stream.setMessages }
      : {
          appendLocalUserRows: stream.appendLocalUserRows,
          drainedCount: stream.drainedCount,
        }),
  });

  useCopilotNotifications(sessionId);

  const {
    onSend: sendNewMessage,
    isUploadingFiles,
    pendingSend,
    setPendingFileParts,
  } = useSendMessage({
    sessionId,
    sendMessage,
    createSession,
    isUserStoppingRef,
  });

  async function sendAfterCurrentTurn(
    message: string,
    files?: File[],
    workspaceFiles?: WorkspaceAttachment[],
    metadata?: ExpertKickoffMetadata,
  ) {
    const trimmed = message.trim();
    const hasAttachments =
      (files?.length ?? 0) > 0 || (workspaceFiles?.length ?? 0) > 0;
    if (!trimmed && !hasAttachments) return;
    if (isExpertSendLocked) return;

    // Sending anything retires the greeting for good: flag it done on
    // the server (kept in the DB, just never shown again) and cache the
    // fact locally so no future visit even has to ask.
    if (!peekGreetingDone(user?.id)) {
      completeGreeting(undefined, {
        onSuccess: () => setGreetingDone(user?.id),
        // Retiring the greeting is bookkeeping — the worst case is
        // seeing it once more — so a failure must never surface here.
        onError: () => undefined,
      });
    }
    if (takeIntroAwaitingFollowup()) {
      trackBrainDump("intro_followup_sent", { chars: trimmed.length });
    }

    let heldForLocalSettle = false;
    while (sessionId && !claimTurn()) {
      if (hasAttachments) {
        toast({
          title: t("Please wait to attach files", "请稍后再添加文件"),
          description: t(
            "File attachments can't be queued until the current response finishes.",
            "当前回复结束前，无法将文件附件加入发送队列。",
          ),
          variant: "destructive",
        });
        return;
      }

      if (!heldForLocalSettle) holdFollowUp(sessionId, trimmed);
      heldForLocalSettle = true;
      if (!(await waitForLocalSettle())) return;
    }

    const dispatch = sendNewMessage(message, files, workspaceFiles, metadata);
    const result = sessionId ? dispatch.finally(releaseTurn) : dispatch;
    if (heldForLocalSettle && sessionId) {
      releaseFollowUp(sessionId, trimmed);
      // Resolve once dispatched, not when the whole answer has streamed:
      // the composer's enqueue path is waiting on this, and holding it for
      // the entire turn would lock Enter and the queue button again.
      void result.catch((err: unknown) =>
        recoverDeferredSend(trimmed, err),
      );
      return;
    }
    return await result;
  }
  // One function for the host's lifetime that runs the latest send handler,
  // so the chat actions and the composer keep their props across flushes.
  const onSend = useStableCallback(
    async (...args: Parameters<typeof sendAfterCurrentTurn>) => {
      await sendAfterCurrentTurn(...args);
    },
  );
  // A suggested task records which chat its message started.
  const onStartTask = useStableCallback((message: string) =>
    sendAfterCurrentTurn(message),
  );

  useWorkflowImportAutoSubmit({
    onSend: sendAfterCurrentTurn,
    setPendingFileParts,
    isSendLocked: isExpertSendLocked,
  });

  const { isKickoffStarting } = useExpertKickoff({
    userId: user?.id ?? null,
    expertId: kickoffExpertId,
    kickoff: kickoffParam === "1",
    sessionId,
    sessionExpertId,
    hasPersistedExpertHistory:
      sessionId && hydratedMessages !== undefined
        ? hydratedMessages.some((message) => !isKickoffMessage(message))
        : null,
    kickoffAttemptToken,
    isClientThreadEmpty: messages.every(isKickoffMessage),
    onAdoptSession: setSessionId,
    async onKickoff(id, attemptToken) {
      const kickoffMessage = buildKickoffMessage(id, attemptToken);
      await sendNewMessage(
        kickoffMessage.text,
        undefined,
        undefined,
        kickoffMessage.metadata,
      );
    },
    onSettled() {
      void setKickoffParam(null, { history: "replace" });
    },
  });

  useSessionTitlePoll({ sessionId, status, isReconnecting });

  return {
    sessionId,
    messages: displayMessages,
    status,
    error,
    stop,
    isReconnecting,
    isFinishProbing,
    isRestoringActiveSession,
    restoreStatusMessage,
    activeStreamStartedAt,
    isUserStopping,
    isLoadingSession,
    isSessionError,
    isSessionNotFound,
    isCreatingSession,
    isUploadingFiles,
    pendingSend,
    isUserLoading,
    isLoggedIn,
    createSession,
    onSend,
    onStartTask,
    onEnqueue: onSend,
    queuedMessages:
      heldFollowUps.length > 0
        ? [...queuedMessages, ...heldFollowUps]
        : queuedMessages,
    hasMoreMessages: hasMore,
    isLoadingMore,
    loadMore,
    turnStats,
    rateLimitMessage,
    platformLimitFailure,
    dismissRateLimit,
    providerLimit,
    dismissProviderLimit,
    // sessionDryRun is the CURRENT session's immutable dry_run flag from API,
    // used to render the banner. The global `isDryRun` preference (for new
    // sessions) lives in the store and is consumed by the toggle button.
    sessionDryRun,
    sessionChatStatus,
    sessionSentFrom,
    sessionAutopilotMode,
    chatLlmAuthProvider,
    expertIdentity,
    isResolvingExpertIdentity,
    isAdoptingExpertSession,
    isKickoffStarting: isKickoffResolving || isKickoffStarting,
    followBackendTurn,
  };
}

// One entry point per stream hook: the compiler cannot memoise a hook picked
// at runtime. The host mounts one or the other, keyed by the stream flag.
export function useCopilotPage() {
  const session = useCopilotPageSession();
  const stream = useCopilotStream(session.streamArgs);
  return useCopilotPageChat(session, stream);
}

export function useCopilotRuntimePage() {
  const session = useCopilotPageSession();
  const stream = useCopilotRuntimeStream(session.streamArgs);
  return useCopilotPageChat(session, stream);
}
