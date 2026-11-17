import { useTranslation } from "@/lib/i18n/LanguageProvider";
import { useRenameWorkspaceFile } from "@/app/api/__generated__/endpoints/workspace/workspace";
import type { WorkspaceFileItem } from "@/app/api/__generated__/models/workspaceFileItem";
import { useToast } from "@/components/molecules/Toast/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { ARTIFACTS_LIST_QUERY_KEY } from "../../useArtifactsPage";
import { validateFileName } from "./helpers";

export function useRenameFileDialog(
  file: WorkspaceFileItem,
  onRenamed: () => void,
) {
  const { t } = useTranslation();
  const [name, setName] = useState(file.name);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { mutateAsync: rename, isPending } = useRenameWorkspaceFile({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ARTIFACTS_LIST_QUERY_KEY });
        toast({ title: t("File renamed", "文件已重命名") });
        onRenamed();
      },
      onError: (error) => {
        toast({
          title: t("Failed to rename file", "无法重命名文件"),
          description:
            error instanceof Error
              ? error.message
              : t("Please try again.", "请重试。"),
          variant: "destructive",
        });
      },
    },
  });

  const trimmed = name.trim();
  const validationError = validateFileName(trimmed);
  const isUnchanged = trimmed === file.name;
  const canSubmit = validationError === null && !isUnchanged && !isPending;

  function handleSubmit() {
    if (!canSubmit) return;
    rename({ fileId: file.id, data: { name: trimmed } }).catch(() => {
      // Already surfaced by the mutation's onError toast.
    });
  }

  return {
    name,
    setName,
    validationError: trimmed.length > 0 ? validationError : null,
    canSubmit,
    isPending,
    handleSubmit,
  };
}
