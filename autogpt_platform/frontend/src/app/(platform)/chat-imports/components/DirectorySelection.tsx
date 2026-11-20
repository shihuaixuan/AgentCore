import { Button } from "@/components/atoms/Button/Button";
import { Text } from "@/components/atoms/Text/Text";
import { useTranslation } from "@/lib/i18n/LanguageProvider";
import { useEffect, useState } from "react";
import type { DirectoryReview, ReviewEntry } from "../directoryReview";
import type { useDirectorySync } from "../useDirectorySync";
import type { ImportConversation } from "../validation";
import { ArchiveChatTranscript } from "./ArchiveChatTranscript";
import { ConversationReviewRow } from "./ImportConversationRow";
import { ImportNotice } from "./ImportNotice";

const PAGE_SIZE = 20;

type Props = Pick<
  ReturnType<typeof useDirectorySync>,
  "busy" | "selected" | "toggle" | "selectAll" | "confirm"
> & { review: DirectoryReview };

export function DirectorySelection({
  review,
  selected,
  busy,
  toggle,
  selectAll,
  confirm,
}: Props) {
  const { t } = useTranslation();
  const [page, setPage] = useState(0);
  const [preview, setPreview] = useState<ReviewEntry>();
  const { entries, skipped, copies, conflicts } = review;
  const all = selected.size === entries.length;
  const pages = Math.ceil(entries.length / PAGE_SIZE);
  function changePage(next: number) {
    setPreview(undefined);
    setPage(next);
  }

  return (
    <div className="space-y-3 border-t border-border-base pt-4">
      <Text variant="body-medium" role="status">
        {entries.length
          ? t(
              `${entries.length} conversations · ${selected.size} selected`,
              `共 ${entries.length} 条会话，已选 ${selected.size} 条`,
            )
          : t(
              "No supported conversations were found.",
              "此目录没有可同步的会话。",
            )}
      </Text>
      {skipped > 0 && (
        <Text variant="small" tone="secondary">
          {t(
            `Skipped ${skipped} unsupported, unreadable or unattributed conversations.`,
            `已跳过 ${skipped} 条无法解析、无法确认归属或没有公开问答的会话。`,
          )}
        </Text>
      )}
      {copies > 0 && (
        <Text variant="small" tone="secondary">
          {t(
            `Ignored ${copies} identical copies in this folder.`,
            `已忽略目录内 ${copies} 份内容相同的副本。`,
          )}
        </Text>
      )}
      {conflicts > 0 && (
        <Text variant="small" tone="secondary">
          {t(
            `${conflicts} conversations have conflicting copies. Choose a folder containing only the version you want.`,
            `${conflicts} 条会话存在内容不同的副本，未列入选择。请选择只含所需版本的目录。`,
          )}
        </Text>
      )}
      {entries.length > 0 && (
        <>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="secondary"
              size="small"
              disabled={busy}
              onClick={() => selectAll(!all)}
            >
              {all ? t("Deselect all", "取消全选") : t("Select all", "全选")}
            </Button>
            <Button
              type="button"
              size="small"
              disabled={busy || !selected.size}
              onClick={confirm}
            >
              {t("Sync selected chats", "同步已选会话")}
            </Button>
          </div>
          <ul aria-label={t("Conversations in this folder", "目录中的会话")}>
            {entries
              .slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)
              .map((entry, index) => (
                <ConversationReviewRow
                  key={page * PAGE_SIZE + index}
                  title={entry.title}
                  messageCount={entry.messageCount}
                  omittedUnattributed={entry.omittedUnattributed}
                  checked={selected.has(entry)}
                  disabled={busy}
                  expanded={preview === entry}
                  onSelect={(checked) => toggle(entry, checked)}
                  onPreview={() =>
                    setPreview(preview === entry ? undefined : entry)
                  }
                >
                  <DirectoryPreview entry={entry} review={review} />
                </ConversationReviewRow>
              ))}
          </ul>
          {pages > 1 && (
            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                variant="secondary"
                size="small"
                disabled={page === 0}
                onClick={() => changePage(page - 1)}
              >
                {t("Previous conversations", "上一页会话")}
              </Button>
              <Text variant="small" tone="secondary">
                {t(
                  `Page ${page + 1} of ${pages}`,
                  `第 ${page + 1} / ${pages} 页`,
                )}
              </Text>
              <Button
                type="button"
                variant="secondary"
                size="small"
                disabled={page + 1 === pages}
                onClick={() => changePage(page + 1)}
              >
                {t("Next conversations", "下一页会话")}
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function DirectoryPreview({
  entry,
  review,
}: {
  entry: ReviewEntry;
  review: DirectoryReview;
}) {
  const { t } = useTranslation();
  const [chat, setChat] = useState<ImportConversation>();
  const [error, setError] = useState<unknown>();
  useEffect(() => {
    let open = true;
    review.load(entry).then(
      (chat) => {
        if (open) setChat(chat);
      },
      (error) => {
        if (open) setError(error);
      },
    );
    return () => {
      open = false;
    };
  }, [entry, review]);
  if (error) return <ImportNotice error={error} />;
  if (chat) return <ArchiveChatTranscript messages={chat.messages} />;
  return (
    <Text variant="small" tone="secondary" role="status">
      {t("Loading preview…", "正在读取预览…")}
    </Text>
  );
}
