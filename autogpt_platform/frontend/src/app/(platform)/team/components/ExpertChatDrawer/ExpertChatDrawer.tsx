"use client";

import { useTranslation } from "@/lib/i18n/LanguageProvider";
import { getExpertDisplayTitle } from "@/services/experts/expert-role-label";

import { ChatInput } from "@/app/(platform)/copilot/components/ChatInput/ChatInput";
import { ChatMessagesContainer } from "@/app/(platform)/copilot/components/ChatMessagesContainer/ChatMessagesContainer";
import { CopilotChatActionsProvider } from "@/app/(platform)/copilot/components/CopilotChatActionsProvider/CopilotChatActionsProvider";
import { Button } from "@/components/atoms/Button/Button";
import { Text } from "@/components/atoms/Text/Text";
import { AUTOPILOT_NAME } from "@/components/molecules/AutopilotAvatar/helpers";
import { ArrowExpandIcon, NoteEditIcon } from "@hugeicons/core-free-icons";
import { ExpertSidePanel } from "../ExpertSidePanel/ExpertSidePanel";
import {
  IdentityAvatar,
  PanelIdentity,
} from "../ExpertSidePanel/IdentityAvatar";
import type { ChatTarget } from "./helpers";
import { useExpertChatDrawer } from "./useExpertChatDrawer";

const DEFAULT_CHAT_WIDTH = 480;

interface Props {
  target: ChatTarget | null;
  onClose: () => void;
  resumeLatest?: boolean;
  threadKey?: number;
  /** Sent as the first message of the thread started by `threadKey`. */
  seedPrompt?: string | null;
}

export function ExpertChatDrawer({
  target,
  onClose,
  resumeLatest = true,
  threadKey = 0,
  seedPrompt = null,
}: Props) {
  const { t, locale } = useTranslation();
  const chat = useExpertChatDrawer({
    target,
    isOpen: target !== null,
    resumeLatest,
    threadKey,
    seedPrompt,
  });
  const copilotHref = chat.sessionId
    ? `/copilot?sessionId=${encodeURIComponent(chat.sessionId)}`
    : target?.expertId
      ? `/copilot?expertId=${target.expertId}&new=1`
      : "/copilot";
  const identity = target
    ? {
        name:
          target.expertId === null
            ? AUTOPILOT_NAME
            : getExpertDisplayTitle(target, locale),
        avatarUrl: target.avatarUrl,
        color: target.color,
        isAutopilot: target.expertId === null,
      }
    : null;

  return (
    <ExpertSidePanel
      identity={identity}
      title={identity?.name ?? ""}
      ariaLabel={
        identity
          ? t(`Chat with ${identity.name}`, `与 ${identity.name} 聊天`)
          : ""
      }
      panelId="chat"
      closeLabel={t("Close chat panel", "关闭聊天面板")}
      showIdentity={!!chat.sessionId}
      headerActions={
        <>
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            leadingIcon={NoteEditIcon}
            aria-label={t("New task", "新建任务")}
            disabled={!chat.sessionId}
            onClick={chat.startNewThread}
          />
          <Button
            as="NextLink"
            href={copilotHref}
            variant="ghost"
            size="icon-xs"
            leadingIcon={ArrowExpandIcon}
            aria-label={t("Open in Chat", "在聊天中打开")}
          />
        </>
      }
      defaultWidth={DEFAULT_CHAT_WIDTH}
      onClose={onClose}
    >
      {identity && target ? (
        <ChatPanelBody
          key={threadKey}
          target={target}
          identity={identity}
          chat={chat}
        />
      ) : null}
    </ExpertSidePanel>
  );
}

interface BodyProps {
  target: ChatTarget;
  identity: PanelIdentity;
  chat: ReturnType<typeof useExpertChatDrawer>;
}

function ChatPanelBody({ target, identity, chat }: BodyProps) {
  const { t, locale } = useTranslation();
  const {
    sessionId,
    messages,
    status,
    error,
    stop,
    onSend,
    onActionSend,
    queuedMessages,
    isResolvingSession,
    isCreating,
    pendingSend,
  } = chat;

  const isStreaming = status === "streaming" || status === "submitted";

  return (
    <CopilotChatActionsProvider onSend={onActionSend}>
      <div className="flex min-h-0 flex-1 flex-col">
        {isResolvingSession ? (
          <div className="flex flex-1 items-center justify-center px-4 py-6">
            <Text variant="small" tone="muted">
              {t("Opening chat…", "正在打开聊天…")}
            </Text>
          </div>
        ) : sessionId || pendingSend ? (
          <div className="flex min-h-0 flex-1 flex-col">
            <ChatMessagesContainer
              messages={messages}
              status={status}
              error={error}
              isLoading={false}
              sessionID={sessionId}
              queuedMessages={queuedMessages}
              pendingSend={pendingSend}
              isTurnSettling={chat.isTurnSettling}
              expertIdentity={
                target.expertId === null
                  ? null
                  : {
                      id: target.expertId,
                      name: identity.name,
                      role: target.role,
                      jobTitle: target.jobTitle,
                      avatarUrl: target.avatarUrl,
                      color: target.color,
                      isArchived: false,
                      readOnlyReason: null,
                    }
              }
              variant="compact"
              showThreadHeader={false}
            />
          </div>
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 py-6 text-center">
            <IdentityAvatar
              identity={identity}
              className="h-24 w-24"
              imageSize={192}
            />
            <div className="space-y-0.5">
              <Text variant="body-medium" tone="primary">
                {t("What can I do for you?", "有什么可以帮你？")}
              </Text>
              <Text variant="small" tone="muted">
                {identity.name}
                {identity.isAutopilot
                  ? ` · ${getExpertDisplayTitle(target, locale)}`
                  : null}
              </Text>
            </div>
          </div>
        )}
        <div className="shrink-0 px-3 pt-2 pb-5">
          <ChatInput
            inputId="expert-chat-input"
            variant="compact"
            onSend={onSend}
            disabled={isResolvingSession || isCreating}
            isUploadingFiles={!!pendingSend}
            isStreaming={isStreaming}
            isTurnStarting={status === "submitted"}
            onStop={stop}
            onEnqueue={onSend}
            canAttachWhileStreaming
            placeholder={t(
              `Message ${identity.name}…`,
              `给 ${identity.name} 发消息…`,
            )}
            hasSession={!!sessionId}
            expertId={target.expertId}
            expertName={identity.name}
            assistantName={identity.name}
          />
        </div>
      </div>
    </CopilotChatActionsProvider>
  );
}
