"use client";

import { useTranslation } from "@/lib/i18n/LanguageProvider";
import {
  File02Icon,
  Folder01Icon,
  Image01Icon,
  SparklesIcon,
  Table01Icon,
  Upload04Icon,
} from "@hugeicons/core-free-icons";
import { Icon } from "@/components/atoms/Icon/Icon";
import { Skeleton } from "@/components/atoms/Skeleton/Skeleton";
import { Text } from "@/components/atoms/Text/Text";
import { ErrorCard } from "@/components/molecules/ErrorCard/ErrorCard";
import { PillFilterMenu } from "../../../components/PillFilterMenu";
import { SectionEmptyState } from "../../../components/SectionEmptyState";
import { ToolbarSearch } from "../../../components/ToolbarSearch";
import { ExpertFileRow } from "./ExpertFileRow";
import { useExpertFilesSection } from "./useExpertFilesSection";

const FILTERS = [
  { value: "all", label: "All files", icon: Folder01Icon },
  { value: "generated", label: "Created", icon: SparklesIcon },
  { value: "uploaded", label: "Uploaded", icon: Upload04Icon },
] as const;

interface Props {
  expertId: string;
  expertName: string;
}

/** Everything in the expert's chats: what it made and what you gave it. */
export function ExpertFilesSection({ expertId, expertName }: Props) {
  const { t } = useTranslation();
  const files = useExpertFilesSection(expertId);

  return (
    <section>
      <div className="mb-2.5 flex flex-wrap items-center justify-between gap-3">
        <Text variant="large-medium" tone="primary">
          {t(`${expertName}'s Files`, `${expertName} 的文件`)}
        </Text>
        <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
          <ToolbarSearch
            textSize="body-md"
            id="expert-files-search"
            label={t("Search files", "搜索文件")}
            value={files.query}
            onChange={files.setQuery}
          />
          <PillFilterMenu
            textSize="body-md"
            label={t("Filter files", "筛选文件")}
            value={files.filter}
            defaultValue="all"
            options={FILTERS.map((option) => ({
              ...option,
              label: t(
                option.label,
                { all: "全部文件", generated: "已创建", uploaded: "已上传" }[
                  option.value
                ],
              ),
            }))}
            onChange={files.setFilter}
          />
        </div>
      </div>

      {files.isLoading ? (
        <div className="mt-4 flex flex-col gap-2">
          <Skeleton className="h-14 w-full rounded-xl" />
          <Skeleton className="h-14 w-full rounded-xl" />
          <Skeleton className="h-14 w-full rounded-xl" />
        </div>
      ) : files.isError ? (
        <ErrorCard
          textSize="body-md"
          context={t(`${expertName}'s files`, `${expertName} 的文件`)}
          hint={t("We could not load the files.", "无法加载文件。")}
          onRetry={() => files.refetch()}
        />
      ) : files.files.length === 0 ? (
        <SectionEmptyState
          tiles={[
            <span key="image" className="inline-flex text-sky">
              <Icon icon={Image01Icon} size={22} />
            </span>,
            <span key="table" className="inline-flex text-success">
              <Icon icon={Table01Icon} size={22} />
            </span>,
            <span key="doc" className="inline-flex text-brand">
              <Icon icon={File02Icon} size={22} />
            </span>,
          ]}
          title={t("No files yet", "暂无文件")}
          description={t(
            `Files you share with ${expertName} and documents it creates show up here.`,
            `你与 ${expertName} 分享的文件及其创建的文档会显示在这里。`,
          )}
        />
      ) : files.visible.length === 0 ? (
        <Text variant="body-md" tone="muted" className="mt-4">
          {t("No files match.", "没有匹配的文件。")}
        </Text>
      ) : (
        <div className="mt-4 rounded-2xl bg-surface p-2 smooth-shadow-ring-sm">
          <ul
            aria-label={t(`${expertName}'s files`, `${expertName} 的文件`)}
            className="flex flex-col"
          >
            {files.visible.map((file) => (
              <li key={file.id}>
                <ExpertFileRow file={file} />
              </li>
            ))}
          </ul>
          {files.hasMore ? (
            <Text variant="small" tone="muted" className="mx-2 mt-2 mb-1">
              {t("Showing the latest 200 files.", "显示最近的 200 个文件。")}
            </Text>
          ) : null}
        </div>
      )}
    </section>
  );
}
