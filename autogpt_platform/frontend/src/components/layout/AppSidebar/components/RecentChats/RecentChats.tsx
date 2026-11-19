"use client";

import { useTranslation } from "@/lib/i18n/LanguageProvider";
import { DeleteChatDialog } from "@/app/(platform)/copilot/components/DeleteChatDialog/DeleteChatDialog";
import { ShareChatDialog } from "@/app/(platform)/copilot/sharing/ShareChatDialog";
import { Button } from "@/components/atoms/Button/Button";
import { Icon } from "@/components/atoms/Icon/Icon";
import { Text } from "@/components/atoms/Text/Text";
import { LoadingSpinner } from "@/components/atoms/LoadingSpinner/LoadingSpinner";
import { SidebarMenu } from "@/components/molecules/Sidebar/Sidebar";
import { ApiError } from "@/lib/autogpt-server-api/helpers";
import { Flag, useGetFlag } from "@/services/feature-flags/use-get-flag";
import { PinIcon } from "@hugeicons/core-free-icons";
import { RecentChatItem } from "./components/RecentChatItem/RecentChatItem";
import { useRecentChats } from "./useRecentChats";

export function RecentChats() {
  const { t } = useTranslation();
  const chatPinningEnabled = useGetFlag(Flag.CHAT_PINNING);

  const isLearningEnabled = useGetFlag(Flag.DREAM_SKILL_LEARNING_ENABLED);
  const {
    sessions,
    isLoading,
    error,
    refetch,
    hasMore,
    isLoadingMore,
    loadMore,
    activeSessionId,
    togglePin,
    editingSessionId,
    editingTitle,
    setEditingTitle,
    startRename,
    submitRename,
    cancelRename,
    exportingIds,
    exportChat,
    sharingSessionId,
    setSharingSessionId,
    excludeFromLearning,
    sessionToDelete,
    isDeleting,
    requestDelete,
    confirmDelete,
    cancelDelete,
  } = useRecentChats();

  if (isLoading) {
    return (
      <div className="flex justify-center py-4">
        <LoadingSpinner size="small" className="text-foreground-tertiary" />
      </div>
    );
  }

  if (error && !sessions.length) {
    const message =
      error instanceof ApiError && error.status === 401
        ? t("Could not verify your sign-in", "无法验证登录状态")
        : t("Could not load recent chats", "无法加载最近对话");

    return (
      <div className="flex flex-col items-start gap-1 px-2 py-2">
        <Text variant="body-tight" as="p" tone="muted" role="status">
          {message}
        </Text>
        <Button variant="secondary" size="small" onClick={() => refetch()}>
          {t("Retry", "重试")}
        </Button>
      </div>
    );
  }

  if (!sessions.length) {
    return (
      <div className="px-2 py-2">
        <Text variant="body-tight" as="p" tone="muted">
          {t("No conversations yet", "暂无对话")}
        </Text>
      </div>
    );
  }

  function renderItem(session: (typeof sessions)[number]) {
    const isEditing = editingSessionId === session.id;
    return (
      <RecentChatItem
        key={session.id}
        session={session}
        isActive={session.id === activeSessionId}
        isEditing={isEditing}
        editingTitle={isEditing ? editingTitle : ""}
        onEditingTitleChange={setEditingTitle}
        onSubmitRename={submitRename}
        onCancelRename={cancelRename}
        isExporting={exportingIds.has(session.id)}
        isDeleting={isDeleting}
        chatPinningEnabled={chatPinningEnabled}
        onPin={togglePin}
        onRename={startRename}
        onExport={exportChat}
        onShare={setSharingSessionId}
        isLearningEnabled={isLearningEnabled}
        onExcludeFromLearning={excludeFromLearning}
        onDelete={requestDelete}
      />
    );
  }

  const pinnedSessions = chatPinningEnabled
    ? sessions.filter((session) => !!session.is_pinned)
    : [];
  const unpinnedSessions =
    pinnedSessions.length > 0
      ? sessions.filter((session) => !session.is_pinned)
      : sessions;

  return (
    <>
      <div className="mt-2 flex flex-col gap-4">
        {pinnedSessions.length > 0 && (
          <div>
            <div className="flex items-center gap-1.5 px-2 pb-1.5 text-foreground-tertiary">
              <Icon icon={PinIcon} className="size-3.5" />
              <Text
                variant="small-medium-tight"
                as="span"
                tone="muted"
                className="truncate"
              >
                {t("Pinned", "已置顶")}
              </Text>
            </div>
            <SidebarMenu>{pinnedSessions.map(renderItem)}</SidebarMenu>
          </div>
        )}
        {unpinnedSessions.length > 0 && (
          <SidebarMenu>{unpinnedSessions.map(renderItem)}</SidebarMenu>
        )}
      </div>

      {hasMore && (
        <button
          type="button"
          onClick={() => loadMore()}
          disabled={isLoadingMore}
          className="mt-1 flex w-full items-center justify-center gap-2 rounded-md bg-surface-active px-2 py-1.5 text-foreground-emphasis hover:bg-border-strong disabled:opacity-60 max-md:py-3"
        >
          {isLoadingMore && (
            <LoadingSpinner
              size="small"
              className="size-4 text-foreground-tertiary"
            />
          )}
          <Text as="span" variant="body-tight-touch" tone="inherit">
            {isLoadingMore
              ? t("Loading…", "加载中…")
              : t("Load more", "加载更多")}
          </Text>
        </button>
      )}

      <DeleteChatDialog
        session={sessionToDelete}
        isDeleting={isDeleting}
        onConfirm={confirmDelete}
        onCancel={cancelDelete}
      />

      {sharingSessionId && (
        <ShareChatDialog
          sessionId={sharingSessionId}
          open={true}
          onOpenChange={(next) => {
            if (!next) setSharingSessionId(null);
          }}
        />
      )}
    </>
  );
}
