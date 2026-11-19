"use client";

import { useTranslation } from "@/lib/i18n/LanguageProvider";
import {
  File02Icon,
  Image01Icon,
  Table01Icon,
} from "@hugeicons/core-free-icons";
import { PanelEmptyState } from "@/app/(platform)/copilot/components/ContextPanel/components/PanelEmptyState/PanelEmptyState";
import type { WorkspaceFileItem } from "@/app/api/__generated__/models/workspaceFileItem";
import { Icon } from "@/components/atoms/Icon/Icon";
import { Skeleton } from "@/components/atoms/Skeleton/Skeleton";
import { ExpertFileRow } from "../../ExpertFilesSection/ExpertFileRow";
import { CardError } from "./CardError";
import { OverviewCard } from "./OverviewCard";

const VISIBLE_OUTPUTS = 5;

interface Props {
  expertName: string;
  outputs: WorkspaceFileItem[];
  isLoading: boolean;
  isError: boolean;
  onRetry: () => unknown;
}

export function LatestOutputs({
  expertName,
  outputs,
  isLoading,
  isError,
  onRetry,
}: Props) {
  const { t } = useTranslation();
  return (
    <OverviewCard title={t("Latest outputs", "最新输出")}>
      {isLoading ? (
        <div className="flex flex-col gap-2">
          <Skeleton className="h-10 w-full rounded-lg" />
          <Skeleton className="h-10 w-full rounded-lg" />
        </div>
      ) : isError ? (
        <CardError
          message={t("Couldn't load outputs.", "无法加载输出。")}
          onRetry={onRetry}
        />
      ) : outputs.length === 0 ? (
        <PanelEmptyState
          textSize="body-md"
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
          title={t("No outputs yet", "暂无输出")}
          description={t(
            `Documents and files ${expertName} creates show up here.`,
            `${expertName} 创建的文档和文件会显示在这里。`,
          )}
        />
      ) : (
        <ul className="-mx-2 flex flex-col">
          {outputs.slice(0, VISIBLE_OUTPUTS).map((file) => (
            <li key={file.id}>
              <ExpertFileRow file={file} />
            </li>
          ))}
        </ul>
      )}
    </OverviewCard>
  );
}
