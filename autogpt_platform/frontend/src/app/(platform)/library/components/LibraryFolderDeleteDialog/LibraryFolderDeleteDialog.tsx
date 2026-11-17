"use client";

import { useTranslation } from "@/lib/i18n/LanguageProvider";
import { Button } from "@/components/atoms/Button/Button";
import { Text } from "@/components/atoms/Text/Text";
import { Dialog } from "@/components/molecules/Dialog/Dialog";
import { useToast } from "@/components/molecules/Toast/use-toast";
import {
  useDeleteV2DeleteFolder,
  getGetV2ListLibraryFoldersQueryKey,
} from "@/app/api/__generated__/endpoints/folders/folders";
import { getGetV2ListLibraryAgentsQueryKey } from "@/app/api/__generated__/endpoints/library/library";
import { useQueryClient } from "@tanstack/react-query";
import type { LibraryFolder } from "@/app/api/__generated__/models/libraryFolder";

interface Props {
  folder: LibraryFolder;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  onDeleted?: () => void;
}

export function LibraryFolderDeleteDialog({
  folder,
  isOpen,
  setIsOpen,
  onDeleted,
}: Props) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { mutate: deleteFolder, isPending } = useDeleteV2DeleteFolder({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: getGetV2ListLibraryFoldersQueryKey(),
        });
        queryClient.invalidateQueries({
          queryKey: getGetV2ListLibraryAgentsQueryKey(),
        });
        toast({
          title: t("Folder deleted", "文件夹已删除"),
          description: t(
            `"${folder.name}" has been deleted.`,
            `“${folder.name}”已删除。`,
          ),
        });
        setIsOpen(false);
        onDeleted?.();
      },
      onError: () => {
        toast({
          title: t("Error", "错误"),
          description: t(
            "Failed to delete folder. Please try again.",
            "删除文件夹失败，请重试。",
          ),
          variant: "destructive",
        });
      },
    },
  });

  function handleDelete() {
    deleteFolder({ folderId: folder.id });
  }

  return (
    <Dialog
      controlled={{
        isOpen,
        set: setIsOpen,
      }}
      styling={{ maxWidth: "32rem" }}
      title={t("Delete folder", "删除文件夹")}
    >
      <Dialog.Content>
        <div>
          <Text variant="large">
            {t(
              `Are you sure you want to delete “${folder.name}”? Workflows inside this folder will be moved back to your library.`,
              `确定要删除“${folder.name}”吗？此文件夹中的工作流将移回你的工作流库。`,
            )}
          </Text>
          <Dialog.Footer>
            <Button
              variant="secondary"
              disabled={isPending}
              onClick={() => setIsOpen(false)}
            >
              {t("Cancel", "取消")}
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              loading={isPending}
            >
              {t("Delete Folder", "删除文件夹")}
            </Button>
          </Dialog.Footer>
        </div>
      </Dialog.Content>
    </Dialog>
  );
}
