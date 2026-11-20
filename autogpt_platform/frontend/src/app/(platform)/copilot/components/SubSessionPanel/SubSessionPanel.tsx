"use client";

import { useGetV2GetSession } from "@/app/api/__generated__/endpoints/chat/chat";
import type { SessionDetailResponse } from "@/app/api/__generated__/models/sessionDetailResponse";
import { Button } from "@/components/atoms/Button/Button";
import { Text } from "@/components/atoms/Text/Text";
import { ExpertAvatar } from "@/components/molecules/ExpertAvatar/ExpertAvatar";
import { FullscreenDialog } from "@/components/molecules/FullscreenDialog/FullscreenDialog";
import { useTranslation } from "@/lib/i18n/LanguageProvider";
import { ArrowUpRight01Icon, Cancel01Icon } from "@hugeicons/core-free-icons";
import type { ReactNode } from "react";
import { resolveExpertIdentity, useExpertMap } from "../../useExpertMap";
import { ChatMessagesContainer } from "../ChatMessagesContainer/ChatMessagesContainer";
import { CopilotChatActionsProvider } from "../CopilotChatActionsProvider/CopilotChatActionsProvider";
import { isSessionLive } from "../ToolChain/subSessionStatus";
import { subSessionHref } from "./SubSessionLink";
import type { SubSessionPreview } from "./SubSessionPreviewContext";
import { useSubSessionTranscript } from "./useSubSessionTranscript";

interface Props {
  preview: SubSessionPreview;
  mobile: boolean;
  onClose: () => void;
}

export function SubSessionPanel({ preview, mobile, onClose }: Props) {
  const { t } = useTranslation();
  const label = t(`${preview.name}'s conversation`, `${preview.name} 的会话`);
  const content = (
    <>
      <PanelHeader preview={preview} onClose={onClose} />
      <ChildTranscript key={preview.sessionID} preview={preview} />
    </>
  );

  return mobile ? (
    <FullscreenDialog title={label} onClose={onClose}>
      {content}
    </FullscreenDialog>
  ) : (
    <aside
      aria-label={label}
      className="flex h-full min-h-0 w-2/5 max-w-xl min-w-72 shrink-0 flex-col border-l border-separator bg-canvas"
    >
      {content}
    </aside>
  );
}

function PanelHeader({ preview, onClose }: Omit<Props, "mobile">) {
  const { t } = useTranslation();
  return (
    <header className="flex h-14 shrink-0 items-center gap-2 border-b border-separator px-4">
      <ExpertAvatar
        name={preview.name}
        avatarUrl={preview.avatarURL}
        backgroundColor={preview.color ?? undefined}
        size={24}
      />
      <Text
        as="h2"
        variant="body-medium"
        tone="primary"
        className="min-w-0 flex-1 truncate"
      >
        {preview.name}
      </Text>
      <Button
        as="NextLink"
        href={subSessionHref(preview.sessionID)}
        variant="ghost"
        size="icon-xs"
        leadingIcon={ArrowUpRight01Icon}
        aria-label={t("Open full conversation", "打开完整会话")}
        withTooltip={false}
        prefetch={false}
      />
      <Button
        type="button"
        variant="ghost"
        size="icon-xs"
        leadingIcon={Cancel01Icon}
        aria-label={t("Close sub-session", "关闭子对话")}
        withTooltip={false}
        onClick={onClose}
      />
    </header>
  );
}

function ChildTranscript({ preview }: { preview: SubSessionPreview }) {
  const { t } = useTranslation();
  const query = useGetV2GetSession(preview.sessionID, undefined, {
    query: {
      retry: false,
      refetchInterval: ({ state }) =>
        state.status !== "error" &&
        state.data?.status === 200 &&
        (isSessionLive(state.data.data) || state.data.data.background_pending)
          ? 3000
          : false,
    },
  });
  const session = query.data?.status === 200 ? query.data.data : null;
  if (query.isPending)
    return (
      <TranscriptNotice text={t("Opening conversation…", "正在打开会话…")} />
    );
  if (!session) {
    return (
      <TranscriptNotice
        text={t("Couldn't load this conversation.", "无法加载此会话。")}
      >
        <Button
          type="button"
          variant="ghost"
          size="small"
          onClick={() => void query.refetch()}
        >
          {t("Retry", "重试")}
        </Button>
      </TranscriptNotice>
    );
  }

  return (
    <TranscriptContent session={session} prompt={preview.prompt ?? null} />
  );
}

function TranscriptContent({
  session,
  prompt,
}: {
  session: SessionDetailResponse;
  prompt: string | null;
}) {
  const { t } = useTranslation();
  const { messages, stats, status, notice } = useSubSessionTranscript(
    session,
    prompt,
  );
  const expertID = session.expert_id ?? null;
  const { expertsById, hasExpertsSettled, hasExpertsErrored } =
    useExpertMap(!!expertID);
  const expertIdentity = resolveExpertIdentity(expertID, expertsById, {
    settled: hasExpertsSettled,
    errored: hasExpertsErrored,
  });
  if (messages.length === 0)
    return (
      <TranscriptNotice text={notice ?? t("No messages yet", "暂无消息")} />
    );

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      {session.has_more_messages && (
        <Text variant="small" tone="secondary" className="mx-4 mt-2">
          {t(
            "Showing recent messages. Open the full conversation for earlier messages.",
            "这里显示最近的消息。打开完整会话可查看更早的消息。",
          )}
        </Text>
      )}
      <CopilotChatActionsProvider onSend={ignoreSend}>
        <ChatMessagesContainer
          sessionID={session.id}
          messages={messages}
          turnStats={stats}
          status={status}
          error={undefined}
          isLoading={false}
          expertIdentity={expertIdentity}
          replyExpertsById={expertsById}
          isResolvingExpertIdentity={!!expertID && !expertIdentity}
          readOnly
          variant="compact"
          showThreadHeader={false}
        />
      </CopilotChatActionsProvider>
      {notice && (
        <Text
          variant="small"
          tone="secondary"
          role="status"
          className="mx-4 mb-3"
        >
          {notice}
        </Text>
      )}
    </div>
  );
}

function ignoreSend() {}

function TranscriptNotice({
  text,
  children,
}: {
  text: string;
  children?: ReactNode;
}) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-2 px-4 text-center">
      <Text variant="small" tone="secondary" role="status">
        {text}
      </Text>
      {children}
    </div>
  );
}
