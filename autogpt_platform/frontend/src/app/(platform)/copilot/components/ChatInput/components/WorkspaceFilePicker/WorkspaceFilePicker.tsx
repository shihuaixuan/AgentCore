"use client";

import { useTranslation } from "@/lib/i18n/LanguageProvider";

import { FolderBreadcrumb } from "@/app/(platform)/artifacts/components/WorkspaceFolders/FolderBreadcrumb";
import { Button } from "@/components/atoms/Button/Button";
import { Input } from "@/components/atoms/Input/Input";
import { Switch } from "@/components/atoms/Switch/Switch";
import { Text } from "@/components/atoms/Text/Text";
import { Dialog } from "@/components/molecules/Dialog/Dialog";
import {
  useWorkspaceFilePicker,
  type PickedItem,
} from "./useWorkspaceFilePicker";
import { WorkspaceFileList } from "./WorkspaceFileList";
import { WorkspaceFolderRows } from "./WorkspaceFolderRows";
import { Search01Icon } from "@hugeicons/core-free-icons";
import { Icon } from "@/components/atoms/Icon/Icon";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (items: PickedItem[]) => void;
  expertId?: string | null;
  /** Names the expert in the filter row; falls back to "this expert". */
  expertName?: string | null;
}

export function WorkspaceFilePicker({
  isOpen,
  onClose,
  onConfirm,
  expertId,
  expertName,
}: Props) {
  const { t } = useTranslation();
  const picker = useWorkspaceFilePicker({ enabled: isOpen, expertId });

  function handleOpenChange(open: boolean) {
    if (!open) {
      picker.reset();
      onClose();
    }
  }

  function handleConfirm() {
    onConfirm(picker.selectedItems);
    picker.reset();
    onClose();
  }

  const who = expertName ?? t("this expert", "此专家");
  const { selectedFileCount: files, selectedFolderCount: folders } = picker;

  return (
    <Dialog
      title={t("Use a file from your workspace", "使用工作区中的文件")}
      styling={{ maxWidth: "48rem" }}
      controlled={{ isOpen, set: handleOpenChange }}
    >
      <Dialog.Content>
        <div className="flex flex-col gap-3">
          <div className="relative flex items-center">
            <Icon
              icon={Search01Icon}
              width={18}
              height={18}
              tone="muted"
              className="absolute top-1/2 left-4 z-20 -translate-y-1/2"
            />
            <Input
              label={t("Search workspace files", "搜索工作区文件")}
              id="workspace-file-picker-search"
              hideLabel
              type="text"
              value={picker.searchTerm}
              onChange={(e) => picker.setSearchTerm(e.target.value)}
              placeholder={t("Search files", "搜索文件")}
              className="w-full pl-12"
              wrapperClassName="!mb-0"
            />
          </div>

          {expertId ? (
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Switch
                  id="picker-expert-only"
                  checked={picker.expertOnly}
                  onCheckedChange={picker.setExpertOnly}
                />
                <label htmlFor="picker-expert-only">
                  <Text tone="body" variant="small-medium" as="span">
                    {t(`Only ${who}’s files`, `仅显示${who}的文件`)}
                  </Text>
                </label>
              </div>
              <Text tone="muted" variant="small">
                {picker.expertOnly
                  ? t(`From your chats with ${who}`, `来自你与${who}的对话`)
                  : t(
                      "Plus your own files and folders",
                      "另含你自己的文件和文件夹",
                    )}
              </Text>
            </div>
          ) : null}

          {picker.showFolders && picker.breadcrumb.length > 0 ? (
            <FolderBreadcrumb
              items={picker.breadcrumb}
              onNavigate={picker.openFolder}
              compact
            />
          ) : null}

          {picker.showFolders ? (
            <WorkspaceFolderRows
              folders={picker.folderRows}
              allFolders={picker.folders}
              selectedIds={picker.selectedFolderIds}
              isLoading={picker.isFoldersLoading}
              onOpen={picker.openFolder}
              onToggleAttach={picker.toggleFolder}
            />
          ) : null}

          <WorkspaceFileList
            files={picker.files}
            selectedIds={picker.selectedIds}
            onSelect={picker.select}
            isLoading={picker.isLoading}
            isError={picker.isError}
            error={picker.error}
            hasMore={picker.hasMore}
            isLoadingMore={picker.isLoadingMore}
            onLoadMore={picker.loadMore}
            emptyMessage={t(
              emptyMessage({
                isExpertOnly: !!expertId && picker.expertOnly,
                who,
                isSearching: picker.searchTerm.trim().length > 0,
                isInFolder: picker.folderId !== null,
                hasFolderRows: picker.folderRows.length > 0,
              }),
              expertId && picker.expertOnly
                ? picker.searchTerm.trim()
                  ? `没有来自${who}的匹配文件。`
                  : `尚无来自${who}的文件。`
                : picker.searchTerm.trim()
                  ? "没有匹配的文件。"
                  : picker.folderId !== null
                    ? picker.folderRows.length > 0
                      ? "此文件夹下没有直接存放的文件。"
                      : "此文件夹为空。"
                    : "工作区中尚无文件。",
            )}
            emptyAction={
              expertId && picker.expertOnly ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="small"
                  onClick={() => picker.setExpertOnly(false)}
                >
                  {t("Show your own files too", "同时显示你自己的文件")}
                </Button>
              ) : null
            }
          />
        </div>

        <Dialog.Footer>
          <Button
            type="button"
            variant="secondary"
            size="small"
            onClick={() => handleOpenChange(false)}
          >
            {t("Cancel", "取消")}
          </Button>
          <Button
            type="button"
            variant="primary"
            size="small"
            disabled={files + folders === 0}
            onClick={handleConfirm}
          >
            {t(
              addLabel(files, folders),
              files + folders === 0
                ? "添加"
                : `添加${[files > 0 ? `${files} 个文件` : "", folders > 0 ? `${folders} 个文件夹` : ""].filter(Boolean).join("和")}`,
            )}
          </Button>
        </Dialog.Footer>
      </Dialog.Content>
    </Dialog>
  );
}

function addLabel(files: number, folders: number): string {
  const parts: string[] = [];
  if (files > 0) parts.push(`${files} ${files === 1 ? "file" : "files"}`);
  if (folders > 0)
    parts.push(`${folders} ${folders === 1 ? "folder" : "folders"}`);
  return parts.length > 0 ? `Add ${parts.join(" and ")}` : "Add";
}

function emptyMessage(opts: {
  isExpertOnly: boolean;
  who: string;
  isSearching: boolean;
  isInFolder: boolean;
  hasFolderRows: boolean;
}): string {
  if (opts.isExpertOnly)
    return opts.isSearching
      ? `No matching files from ${opts.who}.`
      : `No files from ${opts.who} yet.`;
  if (opts.isSearching) return "No matching files.";
  if (opts.isInFolder)
    return opts.hasFolderRows
      ? "No files directly in this folder."
      : "This folder is empty.";
  return "No files in your workspace yet.";
}
