"use client";
import { useTranslation } from "@/lib/i18n/LanguageProvider";
import { Button } from "@/components/atoms/Button/Button";
import { Text } from "@/components/atoms/Text/Text";
import { Dialog } from "@/components/molecules/Dialog/Dialog";
import { useArtifactsFolders } from "../../useArtifactsFolders";
import { FolderTree } from "./components/FolderTree";
import type { MoveSubject } from "./helpers";
import { useMoveToFolderDialog } from "./useMoveToFolderDialog";

interface Props {
  move: MoveSubject;
  /** What is being moved, as shown in the prompt: `“report.pdf”`, `3 files`
      or `“Reports”`. */
  subject: string;
  /** Offer "Files (root)". For files it defaults to "some file is inside a
      folder", which `currentFolderId` alone cannot express for a mixed
      selection; for a folder, to "not already at the root". */
  canMoveToRoot?: boolean;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  onMoved?: () => void;
}

export function MoveToFolderDialog({
  move,
  subject,
  canMoveToRoot,
  isOpen,
  setIsOpen,
  onMoved,
}: Props) {
  const { t } = useTranslation();
  const { folders } = useArtifactsFolders();
  const offerRoot = canMoveToRoot ?? defaultCanMoveToRoot(move, folders);
  const {
    rows,
    selectedKey,
    select,
    toggleExpanded,
    confirm,
    canConfirm,
    isMoving,
  } = useMoveToFolderDialog({
    move,
    canMoveToRoot: offerRoot,
    onDone: () => {
      setIsOpen(false);
      onMoved?.();
    },
  });

  return (
    <Dialog
      controlled={{ isOpen, set: setIsOpen }}
      styling={{ maxWidth: "28rem" }}
      title={t("Move to folder", "移动到文件夹")}
    >
      <Dialog.Content>
        <div className="flex flex-col gap-1">
          <Text variant="small" tone="muted" className="mb-1">
            {t(`Move ${subject} to:`, `将 ${subject} 移动到：`)}
          </Text>
          {rows.length === 0 ? (
            <div className="flex h-20 items-center justify-center">
              <Text variant="small" tone="subtle">
                {folders.length === 0
                  ? t("No folders yet", "暂无文件夹")
                  : t("No other folders", "没有其他文件夹")}
              </Text>
            </div>
          ) : (
            <FolderTree
              rows={rows}
              selectedKey={selectedKey}
              onSelect={select}
              onToggleExpanded={toggleExpanded}
            />
          )}
        </div>
        <Dialog.Footer>
          <Button
            type="button"
            variant="secondary"
            size="small"
            onClick={() => setIsOpen(false)}
          >
            {t("Cancel", "取消")}
          </Button>
          <Button
            type="button"
            variant="primary"
            size="small"
            disabled={!canConfirm}
            loading={isMoving}
            onClick={confirm}
            data-testid="confirm-move-to-folder"
          >
            {t("Move", "移动")}
          </Button>
        </Dialog.Footer>
      </Dialog.Content>
    </Dialog>
  );
}

function defaultCanMoveToRoot(
  move: MoveSubject,
  folders: { id: string; parent_id?: string | null }[],
): boolean {
  if (move.kind === "files") return move.currentFolderId != null;
  const self = folders.find((folder) => folder.id === move.folderId);
  return (self?.parent_id ?? null) !== null;
}
