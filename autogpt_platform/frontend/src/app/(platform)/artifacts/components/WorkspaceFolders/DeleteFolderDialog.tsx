"use client";

import { useTranslation } from "@/lib/i18n/LanguageProvider";
import { Button } from "@/components/atoms/Button/Button";
import { Text } from "@/components/atoms/Text/Text";
import { Dialog } from "@/components/molecules/Dialog/Dialog";

interface Props {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  folderName: string;
  /** Folders that go with it. The delete cascades, so this is the whole
   *  subtree, not the direct children the folder rows summarise. */
  subfolderCount: number;
  isDeleting: boolean;
  onConfirm: () => void;
}

export function DeleteFolderDialog({
  isOpen,
  setIsOpen,
  folderName,
  subfolderCount,
  isDeleting,
  onConfirm,
}: Props) {
  const { t } = useTranslation();
  return (
    <Dialog
      controlled={{ isOpen, set: setIsOpen }}
      styling={{ maxWidth: "28rem" }}
      title={t("Delete folder", "删除文件夹")}
    >
      <Dialog.Content>
        <div className="flex flex-col gap-4">
          <Text variant="body" tone="secondary">
            {t("Delete", "删除")}{" "}
            <span className="font-medium">&ldquo;{folderName}&rdquo;</span>
            {subfolderCount > 0
              ? ` and its ${subfolderCount} ${subfolderCount === 1 ? "folder" : "folders"}? Files inside them will be moved back to the root, not deleted.`
              : "? Files inside it will be moved back to the root, not deleted."}
          </Text>
          <div className="flex justify-end gap-2">
            <Button
              variant="secondary"
              onClick={() => setIsOpen(false)}
              disabled={isDeleting}
            >
              {t("Cancel", "取消")}
            </Button>
            <Button
              variant="destructive"
              onClick={onConfirm}
              loading={isDeleting}
              disabled={isDeleting}
              data-testid="confirm-delete-folder"
            >
              {t("Delete", "删除")}
            </Button>
          </div>
        </div>
      </Dialog.Content>
    </Dialog>
  );
}
