import { useTranslation } from "@/lib/i18n/LanguageProvider";
import { useDeleteWorkspaceFile } from "@/app/api/__generated__/endpoints/workspace/workspace";
import type { WorkspaceFileItem } from "@/app/api/__generated__/models/workspaceFileItem";
import { useToast } from "@/components/molecules/Toast/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import {
  deriveFileOrigin,
  downloadFileBlob,
  invalidateWorkspaceFileQueries,
} from "./helpers";

export function useFileActionsMenu(file: WorkspaceFileItem) {
  const { t } = useTranslation();
  const origin = deriveFileOrigin(file.path);
  const [isMoveOpen, setIsMoveOpen] = useState(false);
  const [isRenameOpen, setIsRenameOpen] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { mutateAsync: deleteFile, isPending: isDeleting } =
    useDeleteWorkspaceFile({
      mutation: {
        onSuccess: () => {
          invalidateWorkspaceFileQueries(queryClient);
          toast({ title: t("File deleted", "文件已删除") });
        },
        onError: (error) => {
          toast({
            title: t("Failed to delete file", "无法删除文件"),
            description:
              error instanceof Error
                ? error.message
                : t("Please try again.", "请重试。"),
            variant: "destructive",
          });
        },
      },
    });

  async function handleDownload() {
    if (isDownloading) return;
    setIsDownloading(true);
    try {
      await downloadFileBlob(file.id, file.name);
    } catch (error) {
      toast({
        title: "Failed to download file",
        description:
          error instanceof Error
            ? error.message
            : t("Please try again.", "请重试。"),
        variant: "destructive",
      });
    } finally {
      setIsDownloading(false);
    }
  }

  async function handleDelete() {
    if (isDeleting) return;
    const confirmed = window.confirm(`Delete "${file.name}"?`);
    if (!confirmed) return;
    try {
      await deleteFile({ fileId: file.id });
    } catch {
      // Already surfaced by the mutation's onError toast.
    }
  }

  return {
    goLabel:
      origin.kind === "session"
        ? t("Open chat", "打开聊天")
        : "Open in Builder",
    goHref: origin.href,
    isMoveOpen,
    setIsMoveOpen,
    isRenameOpen,
    setIsRenameOpen,
    isDownloading,
    isDeleting,
    handleDownload,
    handleDelete,
  };
}
