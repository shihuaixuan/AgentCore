"use client";

import { useTranslation } from "@/lib/i18n/LanguageProvider";
import type { WorkspaceFileItem } from "@/app/api/__generated__/models/workspaceFileItem";
import { Button } from "@/components/atoms/Button/Button";
import { Icon } from "@/components/atoms/Icon/Icon";
import { Text } from "@/components/atoms/Text/Text";
import {
  Cancel01Icon,
  Delete02Icon,
  Folder01Icon,
} from "@hugeicons/core-free-icons";
import { MoveToFolderDialog } from "../../MoveToFolderDialog/MoveToFolderDialog";
import { useSelectionBar } from "./useSelectionBar";

interface Props {
  selectedFiles: WorkspaceFileItem[];
  totalCount: number;
  onSelectAll: () => void;
  onClear: () => void;
}

export function SelectionBar({
  selectedFiles,
  totalCount,
  onSelectAll,
  onClear,
}: Props) {
  const { t } = useTranslation();
  const {
    isMoveOpen,
    setIsMoveOpen,
    isDeleting,
    handleDelete,
    moveSubject,
    sharedFolderId,
  } = useSelectionBar(selectedFiles, onClear);
  const count = selectedFiles.length;

  return (
    <div
      className="flex h-[1.875rem] items-center justify-between gap-3 px-2 pb-2"
      data-testid="artifacts-selection-bar"
    >
      <div className="flex items-center gap-3">
        <Text variant="body-medium" as="span" tone="primary">
          {t(`${count} selected`, `已选择 ${count} 项`)}
        </Text>
        {count < totalCount ? (
          <button
            type="button"
            className="text-body text-foreground-tertiary underline-offset-2 hover:text-foreground-strong hover:underline"
            onClick={onSelectAll}
            data-testid="artifacts-select-all"
          >
            {t("Select all", "全选")} {totalCount}
          </button>
        ) : null}
      </div>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="xs"
          onClick={() => setIsMoveOpen(true)}
          data-testid="artifacts-selection-move"
        >
          <Icon icon={Folder01Icon} size={14} />

          {t("Move to folder", "移动到文件夹")}
        </Button>
        <Button
          variant="outline"
          size="xs"
          disabled={isDeleting}
          onClick={handleDelete}
          tone="danger"
          // oxlint-disable-next-line design-system/no-restyle -- a red outline action's hover; the destructive variant is a red fill
          className="hover:bg-error-surface hover:text-error-foreground"
          data-testid="artifacts-selection-delete"
        >
          <Icon icon={Delete02Icon} size={14} />
          {isDeleting ? t("Deleting…", "正在删除…") : t("Delete", "删除")}
        </Button>
        <button
          type="button"
          aria-label={t("Clear selection", "清除选择")}
          className="inline-flex h-7 w-7 items-center justify-center rounded-full text-foreground-tertiary transition-colors hover:bg-surface-hover hover:text-foreground-strong"
          onClick={onClear}
          data-testid="artifacts-selection-clear"
        >
          <Icon icon={Cancel01Icon} size={16} />
        </button>
      </div>
      {isMoveOpen && (
        <MoveToFolderDialog
          move={{
            kind: "files",
            fileIds: selectedFiles.map((file) => file.id),
            currentFolderId: sharedFolderId,
          }}
          subject={moveSubject}
          canMoveToRoot={selectedFiles.some((file) => file.folder_id != null)}
          isOpen={isMoveOpen}
          setIsOpen={setIsMoveOpen}
          onMoved={onClear}
        />
      )}
    </div>
  );
}
