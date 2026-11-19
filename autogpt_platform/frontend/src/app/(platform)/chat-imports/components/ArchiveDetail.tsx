import { Button } from "@/components/atoms/Button/Button";
import { Text } from "@/components/atoms/Text/Text";
import { useTranslation } from "@/lib/i18n/LanguageProvider";
import { useArchiveDownloads, useArchivedConversation } from "../useArchive";
import { Transcript } from "./Transcript";

type Props = { ownerID: string; id: string; onDeleted: () => Promise<void> };

export function ArchiveDetail({ ownerID, id, onDeleted }: Props) {
  const { t } = useTranslation();
  const { detail, confirming, setConfirming, removal, cancelDelete } =
    useArchivedConversation(ownerID, id, onDeleted);
  const downloads = useArchiveDownloads(id);

  if (detail.isPending)
    return (
      <Text variant="body" role="status">
        {t("Loading transcript…", "正在加载对话记录…")}
      </Text>
    );
  if (detail.isError)
    return (
      <div className="space-y-2">
        <Text variant="body" tone="error-strong" role="alert">
          {t("Could not load the transcript.", "无法加载对话记录。")}
        </Text>
        <Button
          type="button"
          variant="secondary"
          size="small"
          onClick={() => void detail.refetch()}
        >
          {t("Retry", "重试")}
        </Button>
      </div>
    );

  return (
    <div className="space-y-3">
      <Transcript messages={detail.data.messages} />
      {!!detail.data.attachments?.length && (
        <div className="space-y-1">
          <Text as="h3" variant="body-medium">
            {t("Attachments", "附件")}
          </Text>
          <ul className="space-y-1">
            {detail.data.attachments.map(({ id: attachmentID, name, size }) => (
              <li key={attachmentID}>
                <Text variant="small" className="break-all" dir="auto">
                  {t(
                    `${size.toLocaleString()} bytes`,
                    `${size.toLocaleString()} 字节`,
                  )}
                </Text>
                <Button
                  type="button"
                  size="small"
                  variant="secondary"
                  disabled={downloads.isPending}
                  onClick={() => downloads.mutate({ attachmentID, name })}
                >
                  <Text
                    as="span"
                    variant="small"
                    dir="auto"
                    className="break-all"
                  >
                    {name}
                  </Text>
                </Button>
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
      )}
      {confirming ? (
        <div className="space-y-2">
          <Text variant="body" role="status">
            {t(
              "Delete this archived copy? This does not affect the original conversation.",
              "删除此归档副本？这不会影响原始对话。",
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
              disabled={removal.isPending}
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
      ) : (
        <Button
          type="button"
          variant="secondary"
          size="small"
          onClick={() => setConfirming(true)}
        >
          {t("Delete from archive", "从归档中删除")}
        </Button>
      )}
    </div>
  );
}
