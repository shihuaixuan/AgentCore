import { memo, type ReactNode } from "react";
import type { ToolUIPart, UIDataTypes, UIMessage, UITools } from "ai";
import {
  Message,
  MessageContent,
} from "@/components/organisms/Message/Message";
import { HIDDEN_FROM_REPLAY } from "@/lib/replay-privacy";
import type { TurnStats } from "../../../../helpers/convertChatSessionToUiMessages";
import {
  getMessageReplyRecipient,
  getReplyProfession,
} from "../../../../helpers/replyRecipient";
import { isImportedArchiveMessage } from "../../../../helpers/standaloneMessages";
import { useTranslation } from "@/lib/i18n/LanguageProvider";
import {
  DEFAULT_ASSISTANT_AVATAR_URL,
  getDefaultAssistantTitle,
} from "@/services/experts/default-assistant";
import { getExpertDisplayTitle } from "@/services/experts/expert-role-label";
import type { SentFrom } from "../../../../sentFrom";
import { WorkCheckTool } from "../../../../tools/FeedbackPrompts/WorkCheckTool";
import {
  readFeedbackPrompt,
  WORK_CHECK_PART_TYPE,
} from "../../../../tools/FeedbackPrompts/helpers";
import type { ExpertIdentity } from "../../../../useExpertMap";
import { ImportedChatText } from "../../../ImportedChatText";
import { TurnStatsBar } from "../../../JobStatsBar/TurnStatsBar";
import { ScheduledChatNoticeCard } from "../../../ScheduledChatNoticeCard/ScheduledChatNoticeCard";
import { WorkCard } from "../../../WorkCard/WorkCard";
import { ChainMessageParts } from "../ChainMessageParts";
import { MessageAttachments } from "../MessageAttachments";
import { MessagePartRenderer } from "../MessagePartRenderer";
import { ReplyAuthor } from "../ReplyAuthor";
import { SentFromBadge } from "../SentFromBadge";
import { UserMessageClamp } from "../UserMessageClamp";
import { AssistantRowActions } from "./components/AssistantRowActions";
import { UserRowActions } from "./components/UserRowActions";
import {
  areMessageRowPropsEqual,
  getFeedbackCardTarget,
  getMessageContentClassName,
  getRunPreview,
} from "./helpers";
import { useMessageRow } from "./useMessageRow";

type ChatMessage = UIMessage<unknown, UIDataTypes, UITools>;

/**
 * One transcript row. Memoised: while a reply streams only the row whose
 * props change re-renders, so every prop must keep its identity between
 * passes unless the row really changed. Pass row-specific values (`undefined`
 * or `null` on rows they don't apply to) rather than session-wide ones.
 */
interface Props {
  /** The rendered row: a message, or one segment of a turn split at a
   *  mid-turn follow-up. */
  message: ChatMessage;
  /** Last rendered row and an assistant one. Only this row gets `onRetry`
   *  and keeps its actions visible without hover. */
  isLastAssistant: boolean;
  /** `isLastAssistant` while the chat status is streaming or submitted. */
  isCurrentlyStreaming: boolean;
  /** Assistant row that closes its turn: shows the stats bar and actions. */
  isLastInTurn: boolean;
  /** Last rendered row: only the latest turn's stats bar says how it ended. */
  isLatestTurn: boolean;
  /** The latest turn's stream has really ended (see TurnStatsBar). */
  isTurnSettled: boolean;
  /** The latest turn's stream is still settling (probe, reconnect, restore). */
  isTurnSettling?: boolean;
  /** This row's entry from the turn stats map. */
  turnStat?: TurnStats;
  /** The turn this row closes, for the stats bar. Only set when the bar
   *  shows (`isLastInTurn` and not streaming). Compared by elements. */
  turnMessages?: ChatMessage[];
  /** Live elapsed seconds; only the last row gets them. */
  elapsedSeconds?: number;
  /** Thinking indicator rendered at the bottom of the last assistant row. */
  indicator?: ReactNode;
  /** User row while the session is queued; the queue badge shows on the
   *  latest user message. */
  isSessionQueued: boolean;
  /** Session-level provenance, used only by the row that opened the thread. */
  sessionSentFrom: SentFrom | null;
  sessionID?: string | null;
  readOnly: boolean;
  compact: boolean;
  filePattern?: RegExp;
  fileUrlBuilder?: (fileId: string) => string;
  onRetry?: () => void;
  threadExpert?: ExpertIdentity | null;
  replyExpert?: ExpertIdentity;
  replyLabel?: string;
  isResolvingThreadExpert?: boolean;
}

// memo-boundary: a transcript row. The transcript re-renders on every
// streamed flush, and a settled row's props stay the same, so only the
// streaming row renders again.
export const MessageRow = memo(function MessageRow({
  message,
  isLastAssistant,
  isCurrentlyStreaming,
  isLastInTurn,
  isLatestTurn,
  isTurnSettled,
  isTurnSettling,
  turnStat,
  turnMessages,
  elapsedSeconds,
  indicator,
  isSessionQueued,
  sessionSentFrom,
  sessionID,
  readOnly,
  compact,
  filePattern,
  fileUrlBuilder,
  onRetry,
  threadExpert,
  replyExpert,
  replyLabel,
  isResolvingThreadExpert,
}: Props) {
  const { locale } = useTranslation();
  const {
    runMetadata,
    runPreview,
    notice,
    renderableParts,
    textParts,
    copyText,
    hasErrorMarker,
    fileParts,
    folderParts,
    compactionPhase,
    liveCompactionCallId,
    liveCompactionStats,
    sentFrom,
  } = useMessageRow({
    message,
    isCurrentlyStreaming,
    readOnly,
    sessionSentFrom,
  });

  if (isImportedArchiveMessage(message.metadata) && message.role !== "system") {
    return (
      <div className={HIDDEN_FROM_REPLAY}>
        <Message from={message.role} data-message-id={message.id}>
          <MessageContent>
            <ImportedChatText
              role={message.role}
              text={getRunPreview(message.parts)}
            />
          </MessageContent>
        </Message>
      </div>
    );
  }

  // A run-post rides structured metadata — render a compact WorkCard
  // instead of the raw markdown wall (legacy posts have no metadata and
  // fall through to normal rendering).
  if (runMetadata) {
    return (
      <Message
        from={message.role}
        data-message-id={message.id}
        className="duration-300 animate-in fade-in fill-mode-both slide-in-from-bottom-2"
      >
        <MessageContent className="group-[.is-assistant]:bg-transparent">
          <WorkCard metadata={runMetadata} preview={runPreview} />
        </MessageContent>
      </Message>
    );
  }

  // A scheduled chat whose run was skipped says why, with the fix on a
  // button. The model never reads this row back, and it is the owner's: a
  // shared copy of the chat leaves it out.
  if (notice) {
    if (readOnly) return null;
    return (
      <Message
        from={message.role}
        data-message-id={message.id}
        className="duration-300 animate-in fade-in fill-mode-both slide-in-from-bottom-2"
      >
        <MessageContent className="group-[.is-assistant]:bg-transparent">
          <ScheduledChatNoticeCard notice={notice} sessionID={sessionID} />
        </MessageContent>
      </Message>
    );
  }

  const isAssistant = message.role === "assistant";
  const recipient = getMessageReplyRecipient(message);
  const isDefaultAssistant = recipient ? recipient.id === null : !threadExpert;
  const title = recipient?.id
    ? getReplyProfession(recipient, replyExpert ?? threadExpert, locale)
    : !recipient && threadExpert
      ? getExpertDisplayTitle(threadExpert, locale)
      : getDefaultAssistantTitle(locale);
  const name =
    replyLabel &&
    replyExpert &&
    getExpertDisplayTitle(replyExpert, locale) === title
      ? replyLabel
      : title;
  const avatarUrl = isDefaultAssistant
    ? DEFAULT_ASSISTANT_AVATAR_URL
    : recipient
      ? recipient.avatar_url
      : (threadExpert?.avatarUrl ?? null);
  const isResolvingAuthor =
    !recipient && !threadExpert && !!isResolvingThreadExpert;
  const showAuthor =
    isAssistant &&
    (indicator ||
      renderableParts.some((part) =>
        part.type === "text" || part.type === "reasoning"
          ? part.text.trim().length > 0
          : part.type !== "step-start" && part.type !== "tool-TodoWrite",
      ));
  const feedbackTarget = getFeedbackCardTarget({
    isLastAssistant,
    isCurrentlyStreaming,
    readOnly,
    sessionID,
    message,
    savedMessageId: turnStat?.savedMessageId,
  });
  const workCheckPart = feedbackTarget
    ? renderableParts.findLast(
        (part) =>
          part.type === WORK_CHECK_PART_TYPE &&
          readFeedbackPrompt(part as ToolUIPart) !== null,
      )
    : undefined;
  const showActions =
    isLastInTurn &&
    !isCurrentlyStreaming &&
    textParts.length > 0 &&
    !hasErrorMarker;

  return (
    <Message
      from={message.role}
      data-message-id={message.id}
      className="duration-300 animate-in fade-in fill-mode-both slide-in-from-bottom-2"
    >
      {showAuthor && (
        <ReplyAuthor
          name={name}
          avatarUrl={avatarUrl}
          color={recipient ? undefined : threadExpert?.color}
          isLoading={isResolvingAuthor}
        />
      )}
      <MessageContent className={getMessageContentClassName(compact)}>
        {isAssistant ? (
          <ChainMessageParts
            parts={renderableParts}
            messageID={message.id}
            isCurrentlyStreaming={isCurrentlyStreaming}
            onRetry={isLastAssistant ? onRetry : undefined}
            fileUrlBuilder={fileUrlBuilder}
            readOnly={readOnly}
            compactionPhase={compactionPhase}
            liveCompactionCallId={liveCompactionCallId}
            liveCompactionStats={liveCompactionStats}
            feedbackTarget={feedbackTarget}
          />
        ) : (
          <UserMessageClamp
            trailing={sentFrom ? <SentFromBadge sentFrom={sentFrom} /> : null}
          >
            {renderableParts.map((part, i) => (
              <MessagePartRenderer
                key={`${message.id}-${i}`}
                part={
                  part.type === "text"
                    ? {
                        ...part,
                        text: part.text.replace(
                          /\n\n\[custom_mcp:[0-9a-fA-F-]{36}\]$/,
                          "",
                        ),
                      }
                    : part
                }
                messageID={message.id}
                partIndex={i}
                fileUrlBuilder={fileUrlBuilder}
                readOnly={readOnly}
                compactionPhase={compactionPhase}
                liveCompactionCallId={liveCompactionCallId}
                liveCompactionStats={liveCompactionStats}
                isCurrentlyStreaming={isCurrentlyStreaming}
              />
            ))}
          </UserMessageClamp>
        )}
        {isLastInTurn && !isCurrentlyStreaming && (
          <TurnStatsBar
            turnMessages={turnMessages ?? [message]}
            elapsedSeconds={elapsedSeconds}
            stats={turnStat}
            isLatest={isLatestTurn}
            isSettled={isTurnSettled}
            isSettling={isTurnSettling}
          />
        )}
        {indicator}
      </MessageContent>
      {message.role === "user" && (
        <UserRowActions
          showQueueBadge={
            !readOnly && isSessionQueued && !!turnStat?.isLatestUserMessage
          }
          showCopy={textParts.length > 0}
          createdAt={turnStat?.createdAt}
          copyText={copyText}
          sessionID={sessionID}
        />
      )}
      {(fileParts.length > 0 || folderParts.length > 0) && (
        <MessageAttachments
          files={fileParts}
          folders={folderParts}
          isUser={message.role === "user"}
          filePattern={filePattern}
          readOnly={readOnly}
        />
      )}
      {showActions && (
        <AssistantRowActions
          message={message}
          isLastAssistant={isLastAssistant}
          readOnly={readOnly}
          copyText={copyText}
          sessionID={sessionID}
          savedMessageId={turnStat?.savedMessageId}
        />
      )}
      {workCheckPart && feedbackTarget && (
        <WorkCheckTool
          part={workCheckPart as ToolUIPart}
          target={feedbackTarget}
          author={{ title: name, avatarUrl }}
        />
      )}
    </Message>
  );
}, areMessageRowPropsEqual);
