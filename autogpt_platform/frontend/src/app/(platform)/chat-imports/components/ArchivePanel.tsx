import { Button } from "@/components/atoms/Button/Button";
import { Card } from "@/components/atoms/Card/Card";
import { Text } from "@/components/atoms/Text/Text";
import { useTranslation } from "@/lib/i18n/LanguageProvider";
import type { ArchiveSummary } from "../api";
import type { useArchive } from "../useArchive";
import { ArchiveDetail } from "./ArchiveDetail";

type Archive = ReturnType<typeof useArchive>;

function ArchiveRow({
  item,
  open,
  onToggle,
}: {
  item: ArchiveSummary;
  open: boolean;
  onToggle: () => void;
}) {
  const { t, locale } = useTranslation();
  const source =
    item.source === "workbuddy"
      ? "WorkBuddy"
      : item.source === "qwenwork"
        ? t("QwenWork", "千问办公")
        : t("Qianwen", "通义千问");
  const date = new Date(item.imported_at);
  const imported = Number.isNaN(date.getTime())
    ? ""
    : date.toLocaleDateString(locale);

  return (
    <div className="flex min-w-0 flex-col items-start gap-1">
      <Button
        type="button"
        variant="secondary"
        size="small"
        aria-expanded={open}
        onClick={onToggle}
        className="max-w-full"
      >
        <Text
          as="span"
          variant="body-medium"
          tone="inherit"
          className="truncate"
          dir="auto"
        >
          {item.title}
        </Text>
      </Button>
      <Text variant="small" tone="secondary">
        {source} ·{" "}
        {t(`Messages: ${item.message_count}`, `${item.message_count} 条消息`)}
        {imported && t(` · Saved ${imported}`, ` · 保存于 ${imported}`)}
      </Text>
    </div>
  );
}

function ArchivePagination({ page, list, changePage }: Archive) {
  const { t } = useTranslation();
  if (page === 0 && !list.data?.has_more) return null;
  return (
    <nav
      aria-label={t("Archive pages", "归档分页")}
      className="flex flex-wrap items-center gap-2"
    >
      <Button
        type="button"
        variant="secondary"
        size="small"
        disabled={!page}
        onClick={() => changePage(page - 1)}
      >
        {t("Previous page", "上一页")}
      </Button>
      <Text variant="small" tone="secondary">
        {t(`Page ${page + 1}`, `第 ${page + 1} 页`)}
      </Text>
      <Button
        type="button"
        variant="secondary"
        size="small"
        disabled={!list.data?.has_more}
        onClick={() => changePage(page + 1)}
      >
        {t("Next page", "下一页")}
      </Button>
    </nav>
  );
}

export function ArchivePanel({
  ownerID,
  archive,
}: {
  ownerID: string;
  archive: Archive;
}) {
  const { t } = useTranslation();
  const { list, page, activeID, setActiveID, refreshArchive } = archive;
  return (
    <Card variant="outlined" className="min-w-0">
      <section
        aria-labelledby="chat-archive-heading"
        className="space-y-3 p-4 sm:p-6"
      >
        <Text as="h2" variant="h4" id="chat-archive-heading">
          {t("Saved conversations", "已保存的对话")}
        </Text>
        {list.isPending && (
          <Text variant="body" role="status">
            {t("Loading conversations…", "正在加载对话…")}
          </Text>
        )}
        {list.isError && (
          <div className="space-y-2">
            <Text variant="body" tone="error-strong" role="alert">
              {t("Could not load the archive.", "无法加载归档。")}
            </Text>
            <Button
              type="button"
              variant="secondary"
              size="small"
              onClick={() => void list.refetch()}
            >
              {t("Retry", "重试")}
            </Button>
          </div>
        )}
        {list.data && list.data.items.length === 0 && (
          <Text variant="body" tone="secondary">
            {page === 0 && !list.data.has_more
              ? t("No saved conversations yet.", "还没有保存的对话。")
              : t("No conversations on this page.", "此页没有对话。")}
          </Text>
        )}
        {!!list.data?.items.length && (
          <ul className="divide-y divide-border-base">
            {list.data.items.map((item) => (
              <li key={item.id} className="space-y-2 py-3">
                <ArchiveRow
                  item={item}
                  open={activeID === item.id}
                  onToggle={() =>
                    setActiveID(activeID === item.id ? null : item.id)
                  }
                />
                {activeID === item.id && (
                  <ArchiveDetail
                    ownerID={ownerID}
                    id={item.id}
                    onDeleted={refreshArchive}
                  />
                )}
              </li>
            ))}
          </ul>
        )}
        <ArchivePagination {...archive} />
      </section>
    </Card>
  );
}
