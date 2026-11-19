import { Button } from "@/components/atoms/Button/Button";
import { Checkbox } from "@/components/atoms/Checkbox/Checkbox";
import { Text } from "@/components/atoms/Text/Text";
import { useTranslation } from "@/lib/i18n/LanguageProvider";
import { Upload01Icon } from "@hugeicons/core-free-icons";
import { useId, useRef, type ChangeEvent, type ReactNode } from "react";
import { saveWorkBuddy } from "../saveWorkBuddy";
import { useSaveImport, useWorkBuddyDraft } from "../useImportDraft";
import { useWorkBuddyAttachments } from "../useWorkBuddyAttachments";
import { MAX_SELECTION, type ImportConversation } from "../validation";
import { ImportNotice } from "./ImportNotice";
import { Transcript } from "./Transcript";
import { AttachmentChoices, AttachmentFolder } from "./WorkBuddyAttachments";

type RowProps = {
  entry: ImportConversation;
  checked: boolean;
  expanded: boolean;
  disabled: boolean;
  onSelect: (checked: boolean) => void;
  onPreview: () => void;
  children?: ReactNode;
};

function BundleRow({
  entry,
  checked,
  expanded,
  disabled,
  onSelect,
  onPreview,
  children,
}: RowProps) {
  const { t } = useTranslation();
  const id = useId();
  function handleChecked(value: boolean | "indeterminate") {
    onSelect(value === true);
  }

  return (
    <li className="space-y-2 border-b border-border-base py-2 last:border-0">
      <div className="flex min-w-0 items-center gap-3">
        <Checkbox
          aria-labelledby={`${id}-select ${id}-title`}
          checked={checked}
          onCheckedChange={handleChecked}
          disabled={disabled}
        />
        <Text as="span" id={`${id}-select`} variant="small" className="sr-only">
          {t("Select", "选择")}
        </Text>
        <div className="min-w-0 flex-1">
          <Text
            id={`${id}-title`}
            variant="body-medium"
            className="break-words"
            dir="auto"
          >
            {entry.title}
          </Text>
          <Text variant="small" tone="secondary">
            {t(
              `Messages: ${entry.messages.length}`,
              `${entry.messages.length} 条消息`,
            )}
          </Text>
        </div>
        <Button
          type="button"
          variant="secondary"
          size="small"
          aria-expanded={expanded}
          aria-controls={id}
          onClick={onPreview}
        >
          {expanded ? t("Hide preview", "收起预览") : t("Preview", "预览")}
        </Button>
      </div>
      <div id={id} hidden={!expanded} className="space-y-3">
        {expanded && (
          <>
            <Transcript messages={entry.messages} />
            {children}
          </>
        )}
      </div>
    </li>
  );
}

export function WorkBuddyImport({ onSaved }: { onSaved: () => Promise<void> }) {
  const { t } = useTranslation();
  const fileInput = useRef<HTMLInputElement>(null);
  const draft = useWorkBuddyDraft();
  const suggestedRoot = draft.entries.find((entry) => entry.cwd)?.cwd ?? "";
  const attachments = useWorkBuddyAttachments(suggestedRoot);
  const save = useSaveImport(onSaved);
  const busy = draft.loading || save.pending;
  const attachmentCount = [...draft.selected].reduce(
    (total, index) => total + attachments.selectedFiles(index).length,
    0,
  );

  function chooseFile() {
    fileInput.current?.click();
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.currentTarget.files ?? []);
    event.currentTarget.value = "";
    if (!files.length || busy) return;
    attachments.clear();
    save.clearNotice();
    void draft.read(files);
  }

  async function handleSave() {
    if (busy) return;
    const indexes = [...draft.selected].sort((left, right) => left - right);
    const selection = indexes.map((index) => ({
      conversation: draft.entries[index].conversation,
      files: attachments.selectedFiles(index),
    }));
    if (
      await save.submit(() =>
        saveWorkBuddy(selection, (confirmed) => {
          draft.removeSelection(confirmed.map((index) => indexes[index]));
        }),
      )
    ) {
      attachments.clearChecks();
    }
  }

  function handleClear() {
    draft.clear();
    attachments.clear();
    save.clearNotice();
  }

  return (
    <div className="space-y-3">
      <Text variant="body" tone="secondary">
        {t(
          "Choose WorkBuddy conversation files, preview them here, then select the chats to save. The original files stay on your device.",
          "选取 WorkBuddy 会话文件，在此预览并勾选要保存的对话。原文件不会上传。",
        )}
      </Text>
      <Text variant="small" tone="secondary" className="break-words">
        {t(
          "On Windows, look for .jsonl files in your user folder under .workbuddy\\projects and its subfolders. You can also open a previously exported JSON bundle.",
          "Windows：在文件选择框中打开 %USERPROFILE%\\.workbuddy\\projects，在子文件夹里选择 .jsonl 会话文件。也兼容之前导出的 JSON 文件。",
        )}
      </Text>
      <input
        ref={fileInput}
        type="file"
        accept=".jsonl,.json"
        multiple
        aria-label={t("Choose WorkBuddy files", "选择 WorkBuddy 文件")}
        className="hidden"
        onChange={handleFileChange}
        disabled={busy}
      />
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="secondary"
          size="small"
          leadingIcon={Upload01Icon}
          onClick={chooseFile}
          disabled={busy}
          loading={draft.loading}
        >
          {t("Choose conversation files", "选择会话文件")}
        </Button>
        {draft.filesRead > 0 && (
          <Button
            type="button"
            variant="ghost"
            size="small"
            onClick={handleClear}
            disabled={busy}
          >
            {t("Clear files", "清除文件")}
          </Button>
        )}
      </div>
      {draft.filesRead > 0 && (
        <Text
          variant="small"
          tone="secondary"
          className="break-words"
          dir="auto"
        >
          {t(
            `Files read: ${draft.filesRead}`,
            `已读取 ${draft.filesRead} 个文件`,
          )}
        </Text>
      )}
      {draft.filesRead > 0 && draft.entries.length === 0 && (
        <Text variant="body" role="status">
          {t("These files contain no conversations.", "选中的文件不包含对话。")}
        </Text>
      )}
      {draft.entries.length > 0 && (
        <>
          {draft.entries.some((entry) => entry.references.length > 0) && (
            <AttachmentFolder
              sourceRoot={attachments.sourceRoot}
              folder={attachments.directory?.folder}
              mapped={attachments.mapped}
              disabled={busy}
              onRoot={attachments.changeRoot}
              onFolder={attachments.chooseDirectory}
              onConfirm={attachments.confirmMapping}
            />
          )}
          <ul
            className="max-h-[32rem] overflow-auto"
            aria-label={t("WorkBuddy conversations", "WorkBuddy 对话")}
          >
            {draft.entries.map((entry, index) => (
              <BundleRow
                key={index}
                entry={entry.conversation}
                checked={draft.selected.has(index)}
                expanded={draft.preview === index}
                disabled={
                  busy ||
                  (!draft.selected.has(index) &&
                    draft.selected.size >= MAX_SELECTION)
                }
                onSelect={(checked) => draft.toggle(index, checked)}
                onPreview={() =>
                  draft.setPreview(draft.preview === index ? null : index)
                }
              >
                {draft.preview === index && (
                  <AttachmentChoices
                    {...attachments.preview(entry, index)}
                    selected={attachments.selectedFiles(index)}
                    disabled={busy}
                    onPick={(files) => attachments.chooseManual(index, files)}
                    onToggle={(file, include) =>
                      attachments.toggle(index, file, include)
                    }
                  />
                )}
              </BundleRow>
            ))}
          </ul>
          <Text variant="small" tone="secondary" role="status">
            {t(
              `${draft.selected.size} selected · up to ${MAX_SELECTION} per save`,
              `已选择 ${draft.selected.size} 条，每次最多保存 ${MAX_SELECTION} 条`,
            )}
          </Text>
          {attachmentCount > 0 && (
            <Text variant="small" tone="secondary">
              {t(
                `Attachments to upload: ${attachmentCount}`,
                `待上传附件：${attachmentCount} 个`,
              )}
            </Text>
          )}
        </>
      )}
      <Button
        type="button"
        size="small"
        loading={save.pending}
        disabled={busy || !draft.selected.size}
        onClick={handleSave}
      >
        {t("Save selected", "保存选中对话")}
      </Button>
      <ImportNotice error={draft.error ?? save.error} result={save.result} />
    </div>
  );
}
