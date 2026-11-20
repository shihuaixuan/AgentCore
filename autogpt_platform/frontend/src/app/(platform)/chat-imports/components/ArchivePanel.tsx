import { Button } from "@/components/atoms/Button/Button";
import { Card } from "@/components/atoms/Card/Card";
import { Icon } from "@/components/atoms/Icon/Icon";
import { Text } from "@/components/atoms/Text/Text";
import { useTranslation } from "@/lib/i18n/LanguageProvider";
import { BubbleChatIcon } from "@hugeicons/core-free-icons";
import { useId } from "react";
import type { ArchiveSummary } from "../api";
import type { useArchive } from "../useArchive";
import { ArchiveDetail } from "./ArchiveDetail";

type Archive = ReturnType<typeof useArchive>;

type ArchiveRowProps = {
  item: ArchiveSummary;
  selected: boolean;
  onSelect: () => void;
};

function ArchiveRow({ item, selected, onSelect }: ArchiveRowProps) {
  const labelID = useId();
  return (
    <Button
      type="button"
      variant="toggle"
      size="row"
      aria-pressed={selected}
      aria-labelledby={labelID}
      onClick={onSelect}
      className="h-auto w-full items-start justify-start text-left"
    >
      <Icon
        icon={BubbleChatIcon}
        size={16}
        className="mt-0.5 shrink-0"
        aria-hidden
      />
      <span className="flex min-w-0 flex-col gap-1">
        <Text
          id={labelID}
          as="span"
          variant="body-medium"
          className="truncate"
          dir="auto"
        >
          {item.title}
        </Text>
        <ArchiveMetadata item={item} />
      </span>
    </Button>
  );
}

function ArchiveMetadata({ item }: { item: ArchiveSummary }) {
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
    <Text
      as="span"
      variant="small"
      tone="secondary"
      className="whitespace-normal"
    >
      {source} ·{" "}
      {t(`Messages: ${item.message_count}`, `${item.message_count} 条消息`)}
      {imported && t(` · Saved ${imported}`, ` · 保存于 ${imported}`)}
    </Text>
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
        size="xs"
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
        size="xs"
        disabled={!list.data?.has_more}
        onClick={() => changePage(page + 1)}
      >
        {t("Next page", "下一页")}
      </Button>
    </nav>
  );
}

function ArchiveList({ list, page, activeID, setActiveID }: Archive) {
  const { t } = useTranslation();
  if (list.isPending) {
    return (
      <Text variant="body" role="status">
        {t("Loading conversations…", "正在加载对话…")}
      </Text>
    );
  }
  if (list.isError) {
    return (
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
    );
  }
  if (!list.data.items.length) {
    return (
      <Text variant="body" tone="secondary">
        {page === 0 && !list.data.has_more
          ? t("No saved conversations yet.", "还没有保存的对话。")
          : t("No conversations on this page.", "此页没有对话。")}
      </Text>
    );
  }
  return (
    <ul
      aria-label={t("Saved conversations", "已保存的对话")}
      className="max-h-52 space-y-1 overflow-y-auto p-1 md:max-h-[35rem]"
    >
      {list.data.items.map((item) => (
        <li key={item.id}>
          <ArchiveRow
            item={item}
            selected={activeID === item.id}
            onSelect={() => setActiveID(item.id)}
          />
        </li>
      ))}
    </ul>
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
  const { activeID, refreshArchive } = archive;
  return (
    <Card variant="outlined" className="min-w-0">
      <section
        aria-labelledby="chat-archive-heading"
        className="grid min-w-0 divide-y divide-border-base md:grid-cols-[minmax(0,16rem)_minmax(0,1fr)] md:divide-x md:divide-y-0"
      >
        <div className="min-w-0 space-y-3 p-4">
          <Text as="h2" variant="h4" id="chat-archive-heading">
            {t("Saved conversations", "已保存的对话")}
          </Text>
          <ArchiveList {...archive} />
          <ArchivePagination {...archive} />
        </div>
        {activeID ? (
          <ArchiveDetail
            key={activeID}
            ownerID={ownerID}
            id={activeID}
            onDeleted={refreshArchive}
          />
        ) : (
          <div className="flex min-h-40 flex-col items-center justify-center gap-2 p-4 text-center">
            <Icon
              icon={BubbleChatIcon}
              size={24}
              tone="secondary"
              aria-hidden
            />
            <Text variant="body" tone="secondary">
              {t(
                "Select a conversation to see its messages.",
                "选择一条会话，查看历史消息。",
              )}
            </Text>
          </div>
        )}
      </section>
    </Card>
  );
}
