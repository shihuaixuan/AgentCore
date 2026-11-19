import { useTranslation } from "@/lib/i18n/LanguageProvider";
import {
  getGetWorkspaceStorageUsageQueryKey,
  getListWorkspaceFoldersQueryKey,
} from "@/app/api/__generated__/endpoints/workspace/workspace";
import { useToast } from "@/components/molecules/Toast/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRef, useState } from "react";
import type { ChangeEvent } from "react";
import { useArtifactsFolders } from "../../useArtifactsFolders";
import { ARTIFACTS_LIST_QUERY_KEY } from "../../useArtifactsPage";
import { uploadFiles } from "./helpers";

export function useNewMenu(selectedFolderId: string | null) {
  const { t, locale } = useTranslation();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { createFolder, isCreating } = useArtifactsFolders();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const upload = useMutation({
    mutationFn: (files: File[]) => uploadFiles(files, selectedFolderId, locale),
    onSuccess: ({ uploaded, leftAtRoot, failed }) => {
      if (uploaded > 0) {
        toast({
          title: t(
            uploaded === 1 ? "File uploaded" : `${uploaded} files uploaded`,
            `已上传 ${uploaded} 个文件`,
          ),
        });
      }
      if (leftAtRoot.length > 0) {
        toast({
          title: t("Uploaded to the root instead", "已上传至根目录"),
          description: t(
            `${leftAtRoot.join(", ")} couldn't be moved into this folder.`,
            `无法将 ${leftAtRoot.join("、")} 移入此文件夹。`,
          ),
        });
      }
      for (const failure of failed) {
        toast({
          title: t(
            `Failed to upload ${failure.name}`,
            `无法上传 ${failure.name}`,
          ),
          description: failure.message,
          variant: "destructive",
        });
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ARTIFACTS_LIST_QUERY_KEY });
      queryClient.invalidateQueries({
        queryKey: getListWorkspaceFoldersQueryKey(),
      });
      queryClient.invalidateQueries({
        queryKey: getGetWorkspaceStorageUsageQueryKey(),
      });
    },
  });

  function openFilePicker() {
    fileInputRef.current?.click();
  }

  function handleFilesSelected(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    // Reset so picking the same file again still fires a change event.
    event.target.value = "";
    if (files.length === 0) return;
    upload.mutate(files);
  }

  function handleCreateFolder(values: { name: string }) {
    createFolder({ ...values, parentId: selectedFolderId })
      .then(() => setIsCreateOpen(false))
      .catch(() => {});
  }

  return {
    fileInputRef,
    isUploading: upload.isPending,
    openFilePicker,
    handleFilesSelected,
    isCreateOpen,
    setIsCreateOpen,
    isCreating,
    handleCreateFolder,
  };
}
