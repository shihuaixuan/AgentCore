import { Button } from "@/components/atoms/Button/Button";
import { Text } from "@/components/atoms/Text/Text";
import { useTranslation } from "@/lib/i18n/LanguageProvider";
import type { useImportAttachments } from "../useImportAttachments";
import type { useQwenWorkDraft } from "../useQwenWorkDraft";
import { MAX_SELECTION } from "../validation";
import { AttachmentChoices, AttachmentFolder } from "./ImportAttachments";
import { ImportConversationRow } from "./ImportConversationRow";

type PreviewProps = {
  draft: ReturnType<typeof useQwenWorkDraft>;
  attachments: ReturnType<typeof useImportAttachments>;
  busy: boolean;
  onPageChange: (page: number) => void;
};

export function QwenWorkPreview({
  draft,
  attachments,
  busy,
  onPageChange,
}: PreviewProps) {
  const { t } = useTranslation();
  const result = draft.result;
  if (!result) return null;
  const attachmentCount = [...draft.selected].reduce(
    (count, index) => count + attachments.selectedFiles(index).length,
    0,
  );
  return (
    <>
      <Text variant="small" tone="secondary" role="status">
        {draft.entries.length > 0
          ? t(
              `${draft.entries.length} conversations found · ${draft.selected.size} selected`,
              `发现 ${draft.entries.length} 条对话，已选择 ${draft.selected.size} 条`,
            )
          : t(
              "No supported local text conversations in this batch.",
              "这一批没有可导入的本地文本对话。",
            )}
        {attachmentCount > 0 &&
          t(
            ` · ${attachmentCount} attachments selected`,
            ` · 已选择 ${attachmentCount} 个附件`,
          )}
      </Text>
      {result.skipped > 0 && (
        <Text variant="small" tone="secondary">
          {t(
            `Skipped ${result.skipped} conversations with no supported text, invalid data, or oversized messages.`,
            `跳过 ${result.skipped} 条没有可读文本、格式不受支持或超过大小限制的对话。`,
          )}
        </Text>
      )}
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
      {draft.entries.length > 0 && (
        <QwenWorkRows draft={draft} attachments={attachments} busy={busy} />
      )}
      <QwenWorkBatchNavigation
        page={result.page}
        hasOlder={result.hasOlder}
        busy={busy}
        hasSelection={draft.selected.size > 0}
        onChange={onPageChange}
      />
    </>
  );
}

function QwenWorkRows({
  draft,
  attachments,
  busy,
}: Omit<PreviewProps, "onPageChange">) {
  const { t } = useTranslation();
  return (
    <ul
      className="max-h-[32rem] overflow-auto"
      aria-label={t("QwenWork conversations", "千问办公对话")}
    >
      {draft.entries.map((entry, index) => (
        <ImportConversationRow
          key={entry.conversation.source_id}
          entry={entry.conversation}
          checked={draft.selected.has(index)}
          expanded={draft.preview === index}
          disabled={
            busy ||
            (!draft.selected.has(index) && draft.selected.size >= MAX_SELECTION)
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
        </ImportConversationRow>
      ))}
    </ul>
  );
}

function QwenWorkBatchNavigation({
  page,
  hasOlder,
  busy,
  hasSelection,
  onChange,
}: {
  page: number;
  hasOlder: boolean;
  busy: boolean;
  hasSelection: boolean;
  onChange: (page: number) => void;
}) {
  const { t } = useTranslation();
  if (!page && !hasOlder) return null;
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          size="small"
          variant="secondary"
          disabled={busy || hasSelection || page === 0}
          onClick={() => onChange(page - 1)}
        >
          {t("Newer conversations", "较新的对话")}
        </Button>
        <Text variant="small" tone="secondary">
          {t(`Batch ${page + 1}`, `第 ${page + 1} 批`)}
        </Text>
        <Button
          type="button"
          size="small"
          variant="secondary"
          disabled={busy || hasSelection || !hasOlder}
          onClick={() => onChange(page + 1)}
        >
          {t("Older conversations", "更早的对话")}
        </Button>
      </div>
      {hasSelection && (
        <Text variant="small" tone="secondary">
          {t(
            "Save or uncheck your selection before changing batches.",
            "请先保存或取消勾选，再切换批次。",
          )}
        </Text>
      )}
    </div>
  );
}
