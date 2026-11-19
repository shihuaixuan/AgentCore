"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import {
  getListWorkspaceFilesQueryKey,
  useDeleteWorkspaceFile,
} from "@/app/api/__generated__/endpoints/workspace/workspace";
import { toast } from "@/components/molecules/Toast/use-toast";
import { useTranslation } from "@/lib/i18n/LanguageProvider";
import { useCopilotUIStore } from "../../store";
import { downloadArtifact } from "../ArtifactPanel/downloadArtifact";
import {
  downloadFilesAsZip,
  fileItemToArtifactRef,
} from "../ContextPanel/components/FilesTab/helpers";
import {
  useSessionFiles,
  type SessionFile,
} from "../ContextPanel/components/FilesTab/useSessionFiles";

export function useWorkspaceFileCards(sessionId: string | null) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const openArtifact = useCopilotUIStore((s) => s.openArtifact);
  // Session-scoped on purpose: the card is this chat's drawer — only files
  // uploaded to or created in this session. The artifacts side panel carries
  // the workspace-wide library.
  const { uploaded, generated, documentCount, isLoading, isError } =
    useSessionFiles(sessionId);
  const [pendingDelete, setPendingDelete] = useState<SessionFile | null>(null);
  const [isZipping, setIsZipping] = useState(false);

  const { mutateAsync: deleteFile, isPending: isDeleting } =
    useDeleteWorkspaceFile({
      mutation: {
        onSuccess: () => {
          // Prefix key: refreshes every files list (card, tabs, artifacts).
          queryClient.invalidateQueries({
            queryKey: getListWorkspaceFilesQueryKey(),
          });
          toast({ title: t("File deleted", "文件已删除"), variant: "success" });
        },
        onError: () =>
          toast({
            title: t("Failed to delete file", "删除文件失败"),
            variant: "destructive",
          }),
      },
    });

  const files = [...generated, ...uploaded];

  function handleOpen(file: SessionFile) {
    openArtifact(fileItemToArtifactRef(file.item));
  }

  function handleDownload(file: SessionFile) {
    downloadArtifact(fileItemToArtifactRef(file.item)).catch(() =>
      toast({
        title: t("Download failed", "下载失败"),
        variant: "destructive",
      }),
    );
  }

  async function handleConfirmDelete() {
    if (!pendingDelete) return;
    try {
      await deleteFile({ fileId: pendingDelete.item.id });
    } catch {
      // onError already toasted; swallow so the dialog closes either way.
    }
    setPendingDelete(null);
  }

  async function handleDownloadAll() {
    if (files.length === 0) return;
    setIsZipping(true);
    try {
      await downloadFilesAsZip(
        files.map((f) => ({ id: f.item.id, name: f.item.name })),
      );
    } catch {
      toast({
        title: t("Download all failed", "批量下载失败"),
        variant: "destructive",
      });
    }
    setIsZipping(false);
  }

  return {
    files,
    documentCount,
    isLoading,
    isError,
    isDeleting,
    isZipping,
    pendingDelete,
    setPendingDelete,
    handleOpen,
    handleDownload,
    handleConfirmDelete,
    handleDownloadAll,
  };
}
