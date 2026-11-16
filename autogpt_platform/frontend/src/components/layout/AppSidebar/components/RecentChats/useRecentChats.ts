import { useTranslation } from "@/lib/i18n/LanguageProvider";
import {
  getV2GetSession,
  usePatchV2UpdateSessionPinned,
  usePatchV2UpdateSessionTitle,
} from "@/app/api/__generated__/endpoints/chat/chat";
import { useExcludeSkillLearningSource } from "@/app/api/__generated__/endpoints/skill-learning/skill-learning";
import { fetchAndExportChat } from "@/app/(platform)/copilot/helpers/exportChatAsMarkdown";
import {
  SESSION_LIST_QUERY_KEY,
  useSessionList,
} from "@/app/(platform)/copilot/useSessionList";
import { useSessionDeletion } from "@/app/(platform)/copilot/useSessionDeletion";
import { toast } from "@/components/molecules/Toast/use-toast";
import { useStableCallback } from "@/hooks/useStableCallback";
import { ApiError } from "@/lib/autogpt-server-api/helpers";
import { CHAT_SOURCE_KIND } from "@/services/skill-learning/helpers";
import { useQueryClient } from "@tanstack/react-query";
import { usePathname, useSearchParams } from "next/navigation";
import { useState } from "react";

export function useRecentChats() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { sessions, isLoading, hasMore, isLoadingMore, loadMore } =
    useSessionList();

  const pathname = usePathname();
  const searchParams = useSearchParams();
  const activeSessionId =
    pathname === "/home" ? searchParams.get("sessionId") : null;

  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState("");
  const [exportingIds, setExportingIds] = useState<Set<string>>(new Set());
  const [sharingSessionId, setSharingSessionId] = useState<string | null>(null);

  const {
    sessionToDelete,
    isDeleting,
    requestDelete,
    confirmDelete,
    cancelDelete,
  } = useSessionDeletion();

  const { mutate: setSessionPinned } = usePatchV2UpdateSessionPinned({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: SESSION_LIST_QUERY_KEY });
      },
      onError: (error) => {
        toast({
          title: t("Failed to update chat", "更新对话失败"),
          description:
            error instanceof Error
              ? error.message
              : t("An error occurred", "发生错误"),
          variant: "destructive",
        });
      },
    },
  });

  const { mutate: renameSession } = usePatchV2UpdateSessionTitle({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: SESSION_LIST_QUERY_KEY });
        setEditingSessionId(null);
      },
      onError: (error) => {
        toast({
          title: t("Failed to rename chat", "重命名对话失败"),
          description:
            error instanceof Error
              ? error.message
              : t("An error occurred", "发生错误"),
          variant: "destructive",
        });
        setEditingSessionId(null);
      },
    },
  });

  const { mutate: excludeSource } = useExcludeSkillLearningSource({
    mutation: {
      onSuccess: () => {
        toast({
          title: t("Excluded from learning", "已排除学习"),
          description: t(
            "This chat will not be used for future skill learning. Skills " +
              "that depended on it were restored or paused.",
            "此对话不会用于今后的技能学习。依赖此对话的技能已恢复或暂停。",
          ),
        });
      },
      onError: (error) => {
        toast({
          title: t("Could not exclude this chat", "无法排除此对话"),
          description:
            error instanceof ApiError
              ? error.message
              : t(
                  "Nothing has been recorded for this chat yet.",
                  "此对话尚无学习记录。",
                ),
          variant: "destructive",
        });
      },
    },
  });

  // Every handler handed to the rows keeps one identity across renders, so the
  // memoised `RecentChatItem`s only re-render when their own props change.
  const excludeFromLearning = useStableCallback((id: string) => {
    excludeSource({ sourceKind: CHAT_SOURCE_KIND, sourceRef: id });
  });

  const togglePin = useStableCallback((id: string, isPinned: boolean) => {
    setSessionPinned({ sessionId: id, data: { is_pinned: !isPinned } });
  });

  const startRename = useStableCallback(
    (id: string, title: string | null | undefined) => {
      setEditingSessionId(id);
      setEditingTitle(title || "");
    },
  );

  const submitRename = useStableCallback((id: string) => {
    const trimmed = editingTitle.trim();
    if (trimmed) {
      renameSession({ sessionId: id, data: { title: trimmed } });
    } else {
      setEditingSessionId(null);
    }
  });

  const cancelRename = useStableCallback(() => setEditingSessionId(null));

  const stableRequestDelete = useStableCallback(requestDelete);

  const exportChat = useStableCallback(handleExport);

  async function handleExport(id: string, title: string | null | undefined) {
    if (exportingIds.has(id)) return;
    setExportingIds((prev) => new Set(prev).add(id));
    try {
      await fetchAndExportChat(id, title, getV2GetSession);
      toast({ title: t("Chat exported", "对话已导出") });
    } catch (error) {
      toast({
        title: t("Export failed", "导出失败"),
        description:
          error instanceof Error
            ? error.message
            : t(
                "Could not export this chat. Please try again.",
                "无法导出此对话，请重试。",
              ),
        variant: "destructive",
      });
    } finally {
      setExportingIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  }

  return {
    sessions,
    isLoading,
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
    requestDelete: stableRequestDelete,
    confirmDelete,
    cancelDelete,
  };
}
