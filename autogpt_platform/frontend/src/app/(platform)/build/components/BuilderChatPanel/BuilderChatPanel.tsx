"use client";

import { ChatInput } from "@/app/(platform)/copilot/components/ChatInput/ChatInput";
import { ChatMessagesContainer } from "@/app/(platform)/copilot/components/ChatMessagesContainer/ChatMessagesContainer";
import { CopilotChatActionsProvider } from "@/app/(platform)/copilot/components/CopilotChatActionsProvider/CopilotChatActionsProvider";
import { cn } from "@/lib/utils";
import { useRef } from "react";
import { NoModelNotice } from "./components/NoModelNotice";
import { PanelHeader } from "./components/PanelHeader";
import { useBuilderChatPanel } from "./useBuilderChatPanel";
import { BubbleChatIcon, Cancel01Icon } from "@hugeicons/core-free-icons";
import { Icon } from "@/components/atoms/Icon/Icon";
import { Text } from "@/components/atoms/Text/Text";
import { useTranslation } from "@/lib/i18n/LanguageProvider";

interface Props {
  className?: string;
}

export function BuilderChatPanel({ className }: Props) {
  const { t } = useTranslation();
  const panelRef = useRef<HTMLDivElement>(null);
  const {
    isOpen,
    handleToggle,
    sessionId,
    messages,
    status,
    error,
    stop,
    onSend,
    queuedMessages,
    isTurnSettling,
    isBootstrapping,
    hasNoModel,
    revertTargetVersion,
    handleRevert,
    bindError,
    bootstrapError,
    retryBind,
    retryBootstrap,
    transportCheckError,
    retryTransportCheck,
  } = useBuilderChatPanel({ panelRef });

  const isStreaming = status === "streaming" || status === "submitted";
  const activeError = bindError ?? bootstrapError ?? transportCheckError;
  const activeRetry = bindError
    ? retryBind
    : bootstrapError
      ? retryBootstrap
      : transportCheckError
        ? retryTransportCheck
        : null;
  const activeErrorTitle = bindError
    ? t("Could not start the builder chat", "无法启动构建助手对话")
    : bootstrapError
      ? t("Could not create a blank workflow", "无法创建空白工作流")
      : t("Could not check the AI connection", "无法检查 AI 连接");

  return (
    <div
      className={cn(
        "pointer-events-none fixed right-4 bottom-4 z-50 flex flex-col items-end gap-2",
        className,
      )}
    >
      {isOpen && (
        <CopilotChatActionsProvider onSend={onSend} chatSurface="builder">
          <div
            ref={panelRef}
            role="complementary"
            aria-label={t("Builder chat panel", "构建助手对话面板")}
            className="pointer-events-auto flex h-[70vh] max-h-[calc(100vh-6rem)] w-[26rem] max-w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-xl border border-node-border bg-surface shadow-2xl sm:h-[75vh]"
          >
            <PanelHeader
              onClose={handleToggle}
              canRevert={revertTargetVersion != null}
              revertTargetVersion={revertTargetVersion}
              onRevert={handleRevert}
            />

            <div className="flex h-0 min-h-0 flex-1 flex-col">
              {hasNoModel ? (
                <NoModelNotice />
              ) : activeError && activeRetry ? (
                <div className="flex flex-1 flex-col px-4 py-6">
                  <Text
                    variant="body-tight"
                    tone="secondary"
                    as="div"
                    role="alert"
                    className="flex flex-1 flex-col items-center justify-center gap-3 text-center"
                  >
                    <Text variant="body-medium-tight" tone="body">
                      {activeErrorTitle}
                    </Text>
                    <Text variant="body-tight" tone="muted">
                      {t(
                        "Something went wrong. Retry to try again.",
                        "出现问题，请重试。",
                      )}
                    </Text>
                    <button
                      type="button"
                      onClick={activeRetry}
                      className="rounded-md border border-border-strong bg-surface px-3 py-1.5 text-foreground-body shadow-sm hover:bg-surface-muted focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none"
                    >
                      <Text
                        variant="body-medium-tight"
                        as="span"
                        tone="inherit"
                      >
                        {t("Retry", "重试")}
                      </Text>
                    </button>
                  </Text>
                </div>
              ) : isBootstrapping ? (
                <div className="flex flex-1 items-center justify-center px-4 py-6">
                  <Text
                    variant="body-tight"
                    tone="muted"
                    as="div"
                    role="status"
                  >
                    {t("Preparing builder chat…", "正在准备构建助手对话…")}
                  </Text>
                </div>
              ) : sessionId ? (
                <>
                  <div className="flex min-h-0 flex-1 flex-col">
                    <ChatMessagesContainer
                      messages={messages}
                      status={status}
                      error={error}
                      isLoading={false}
                      sessionID={sessionId}
                      queuedMessages={queuedMessages}
                      isTurnSettling={isTurnSettling}
                    />
                  </div>
                  <div className="relative shrink-0 border-t border-separator bg-surface px-3 pt-2 pb-2">
                    <ChatInput
                      inputId="builder-chat-input"
                      onSend={onSend}
                      disabled={false}
                      isStreaming={isStreaming}
                      isTurnStarting={status === "submitted"}
                      onStop={stop}
                      onEnqueue={onSend}
                      placeholder={t(
                        "Ask the builder to edit or run this workflow…",
                        "让构建助手编辑或运行此工作流…",
                      )}
                      hasSession={true}
                    />
                  </div>
                </>
              ) : (
                <div className="flex flex-1 items-center justify-center px-4 py-6">
                  <Text variant="body-tight" tone="muted" as="div">
                    {t(
                      "Open a workflow to start chatting with the builder.",
                      "打开工作流，即可与构建助手对话。",
                    )}
                  </Text>
                </div>
              )}
            </div>
          </div>
        </CopilotChatActionsProvider>
      )}

      <button
        type="button"
        onClick={handleToggle}
        aria-expanded={isOpen}
        aria-label={
          isOpen
            ? t("Close chat", "关闭对话")
            : t("Chat with builder", "与构建助手对话")
        }
        className={cn(
          "pointer-events-auto flex h-12 w-12 items-center justify-center rounded-full shadow-lg transition-colors",
          "focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:outline-none",
          isOpen
            ? "bg-action text-action-foreground hover:bg-foreground-body"
            : "border border-node-border bg-surface text-foreground-body hover:bg-surface-muted",
        )}
      >
        {isOpen ? (
          <Icon icon={Cancel01Icon} size={20} />
        ) : (
          <Icon icon={BubbleChatIcon} size={22} />
        )}
      </button>
    </div>
  );
}
