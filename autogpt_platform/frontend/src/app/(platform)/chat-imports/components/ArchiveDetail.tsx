import { Button } from "@/components/atoms/Button/Button";
import { Text } from "@/components/atoms/Text/Text";
import { useTranslation } from "@/lib/i18n/LanguageProvider";
import { ArrowUpRight01Icon } from "@hugeicons/core-free-icons";
import { useArchivedConversation } from "../useArchive";
import { useArchiveSync } from "../useArchiveSync";
import { ImportValidationError } from "../validation";
import { ArchiveChatTranscript } from "./ArchiveChatTranscript";
import { ArchiveAttachments, ArchiveRemoval } from "./ArchiveDetailActions";

type Props = { ownerID: string; id: string; onDeleted: () => Promise<void> };

export function ArchiveDetail({ ownerID, id, onDeleted }: Props) {
  const { t } = useTranslation();
  const conversation = useArchivedConversation(ownerID, id, onDeleted);
  const { detail, confirming, removal } = conversation;
  const sync = useArchiveSync(ownerID, id);

  if (detail.isPending)
    return (
      <Text className="m-4" variant="body" role="status">
        {t("Loading transcript…", "正在加载对话记录…")}
      </Text>
    );
  if (detail.isError)
    return (
      <div className="space-y-2 p-4">
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
    <section
      aria-labelledby="archived-conversation-title"
      className="min-w-0 divide-y divide-border-base"
    >
      <header className="flex flex-wrap items-start justify-between gap-3 px-4 py-4 sm:px-6">
        <div className="min-w-0 flex-1 space-y-1">
          <Text
            as="h3"
            id="archived-conversation-title"
            variant="h5"
            className="break-words"
            dir="auto"
          >
            {detail.data.title}
          </Text>
          <Text variant="small" tone="secondary">
            {t(
              "Sync copies only the messages. Attachments stay here.",
              "仅同步文字消息，附件仍可在归档中下载。",
            )}
          </Text>
        </div>
        <Button
          type="button"
          variant="primary"
          size="small"
          leadingIcon={ArrowUpRight01Icon}
          disabled={confirming || removal.isPending}
          loading={sync.isPending}
          onClick={() => void sync.openChat()}
        >
          {t("Sync to conversations", "同步到会话")}
        </Button>
        {sync.error && (
          <Text
            variant="small"
            tone="error-strong"
            role="alert"
            className="basis-full"
          >
            {sync.error instanceof ImportValidationError &&
            sync.error.code === "archive-destination"
              ? t(
                  "The account changed. Reopen the archive before trying again.",
                  "登录账号已变化，请重新打开归档后再试。",
                )
              : t(
                  "Could not sync the conversation. Try again.",
                  "无法同步对话，请重试。",
                )}
          </Text>
        )}
      </header>
      <ArchiveChatTranscript messages={detail.data.messages} />
      <footer className="space-y-3 px-4 py-3 sm:px-6">
        <ArchiveAttachments
          id={id}
          attachments={detail.data.attachments ?? []}
        />
        <ArchiveRemoval
          conversation={conversation}
          syncPending={sync.isPending}
        />
      </footer>
    </section>
  );
}
