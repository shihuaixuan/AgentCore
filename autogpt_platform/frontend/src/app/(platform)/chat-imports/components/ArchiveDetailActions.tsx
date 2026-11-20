import { Button } from "@/components/atoms/Button/Button";
import { Text } from "@/components/atoms/Text/Text";
import { useTranslation } from "@/lib/i18n/LanguageProvider";
import type { ArchiveAttachment } from "../api";
import {
  useArchiveDownloads,
  type useArchivedConversation,
} from "../useArchive";

export function ArchiveAttachments({
  id,
  attachments,
}: {
  id: string;
  attachments: ArchiveAttachment[];
}) {
  const { t, locale } = useTranslation();
  const downloads = useArchiveDownloads(id);
  if (!attachments.length) return null;

  return (
    <div className="space-y-1">
      <Text as="h4" variant="body-medium">
        {t("Attachments", "附件")}
      </Text>
      <ul className="flex flex-wrap gap-2">
        {attachments.map(({ id: attachmentID, name, size }) => (
          <li
            key={attachmentID}
            className="flex max-w-full min-w-0 items-center gap-2"
          >
            <Button
              type="button"
              size="small"
              variant="secondary"
              className="max-w-full min-w-0"
              disabled={downloads.isPending}
              onClick={() => downloads.mutate({ attachmentID, name })}
            >
              <Text as="span" variant="small" dir="auto" className="truncate">
                {name}
              </Text>
            </Button>
            <Text
              as="span"
              variant="small"
              tone="secondary"
              className="shrink-0"
            >
              {t(
                `${size.toLocaleString(locale)} bytes`,
                `${size.toLocaleString(locale)} 字节`,
              )}
            </Text>
          </li>
        ))}
      </ul>
      {downloads.isError && (
        <Text variant="small" tone="error-strong" role="alert">
          {t(
            "Could not download the attachment. Try again.",
            "无法下载附件，请重试。",
          )}
        </Text>
      )}
    </div>
  );
}

export function ArchiveRemoval({
  conversation,
  syncPending,
}: {
  conversation: ReturnType<typeof useArchivedConversation>;
  syncPending: boolean;
}) {
  const { t } = useTranslation();
  const { confirming, setConfirming, removal, cancelDelete } = conversation;
  if (!confirming) {
    return (
      <Button
        type="button"
        variant="ghost-danger"
        size="small"
        disabled={syncPending}
        onClick={() => setConfirming(true)}
      >
        {t("Delete from archive", "从归档中删除")}
      </Button>
    );
  }

  return (
    <div className="space-y-2">
      <Text variant="body" role="status">
        {t(
          "Delete this archive and its attachments? This keeps the original and any synced conversation.",
          "删除此归档及其附件？原始对话和已同步的会话不受影响。",
        )}
      </Text>
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="secondary"
          size="small"
          disabled={removal.isPending}
          onClick={cancelDelete}
        >
          {t("Cancel", "取消")}
        </Button>
        <Button
          type="button"
          variant="destructive"
          size="small"
          onClick={() => removal.mutate()}
          loading={removal.isPending}
        >
          {t("Confirm delete", "确认删除")}
        </Button>
      </div>
      {removal.isError && (
        <Text variant="body" tone="error-strong" role="alert">
          {t(
            "Could not delete the conversation. Try again.",
            "无法删除对话，请重试。",
          )}
        </Text>
      )}
    </div>
  );
}
