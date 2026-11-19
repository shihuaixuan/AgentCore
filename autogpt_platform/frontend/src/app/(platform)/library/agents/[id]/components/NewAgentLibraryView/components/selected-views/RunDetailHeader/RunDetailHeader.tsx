"use client";

import { useTranslation } from "@/lib/i18n/LanguageProvider";
import { GraphExecution } from "@/app/api/__generated__/models/graphExecution";
import { LibraryAgent } from "@/app/api/__generated__/models/libraryAgent";
import { Text } from "@/components/atoms/Text/Text";
import { formatDistanceToNow, formatDistanceStrict } from "date-fns";
import { zhCN } from "date-fns/locale";
import { AGENT_LIBRARY_SECTION_PADDING_X } from "../../../helpers";
import { RunStatusBadge } from "../SelectedRunView/components/RunStatusBadge";
import { FlaskConicalIcon, TimeScheduleIcon } from "@hugeicons/core-free-icons";
import { Icon } from "@/components/atoms/Icon/Icon";
import { useIsBillingEnabled } from "@/hooks/useIsBillingEnabled";
import { isCompletedWithErrors } from "@/lib/run-health";

type Props = {
  agent: LibraryAgent;
  run: GraphExecution | undefined;
  scheduleRecurrence?: string;
  onSelectRun?: (id: string) => void;
  onClearSelectedRun?: () => void;
};

export function RunDetailHeader({ agent, run, scheduleRecurrence }: Props) {
  const { t, locale } = useTranslation();
  const dateLocale = locale === "zh-CN" ? zhCN : undefined;
  const isBillingEnabled = useIsBillingEnabled();
  return (
    <div className={AGENT_LIBRARY_SECTION_PADDING_X}>
      <div className="flex w-full items-center justify-between">
        <div className="flex w-full flex-col gap-0">
          <div className="flex w-full flex-col flex-wrap items-start justify-between gap-1 md:flex-row md:items-center">
            <div className="flex min-w-0 flex-1 flex-col items-start gap-3">
              {run?.status ? (
                <div className="flex items-center gap-2">
                  <RunStatusBadge
                    status={run.status}
                    completedWithErrors={isCompletedWithErrors(run)}
                  />
                  {run.is_dry_run && (
                    <div className="inline-flex items-center gap-1 rounded-md bg-warning-surface p-1 text-warning-foreground">
                      <Icon icon={FlaskConicalIcon} size={16} />
                      <Text variant="small-medium" tone="warning">
                        {t("Simulated", "模拟运行")}
                      </Text>
                    </div>
                  )}
                </div>
              ) : scheduleRecurrence ? (
                <div className="inline-flex items-center gap-1 rounded-md bg-warning-surface p-1 text-yellow-foreground">
                  <Icon icon={TimeScheduleIcon} size={16} />
                  <Text variant="small-medium" tone="inherit">
                    {t("Scheduled", "已计划")}
                  </Text>
                </div>
              ) : null}
              <Text variant="h2">{agent.name}</Text>
            </div>
          </div>
          {run ? (
            <div className="mt-1 flex flex-wrap items-center gap-2 gap-y-1 text-foreground-subtle">
              <Text variant="small" tone="muted">
                {t("Started", "开始于")}{" "}
                {run.started_at
                  ? formatDistanceToNow(run.started_at, {
                      addSuffix: true,
                      locale: dateLocale,
                    })
                  : "—"}
              </Text>
              <span className="mx-1 inline-block text-border-base">|</span>
              <Text variant="small" tone="muted">
                {t("Version:", "版本：")} {run.graph_version}
              </Text>
              {run.stats?.node_exec_count !== undefined && (
                <>
                  <span className="mx-1 inline-block text-border-base">|</span>
                  <Text variant="small" tone="muted">
                    {t("Steps:", "步骤数：")} {run.stats.node_exec_count}
                  </Text>
                </>
              )}
              {run.stats?.duration !== undefined && (
                <>
                  <span className="mx-1 inline-block text-border-base">|</span>
                  <Text variant="small" tone="muted">
                    {t("Duration:", "耗时：")}{" "}
                    {formatDistanceStrict(0, run.stats.duration * 1000, {
                      locale: dateLocale,
                    })}
                  </Text>
                </>
              )}
              {isBillingEnabled && run.stats?.cost !== undefined && (
                <>
                  <span className="mx-1 inline-block text-border-base">|</span>
                  <Text variant="small" tone="muted">
                    {t("Cost:", "费用：")} ${(run.stats.cost / 100).toFixed(2)}
                  </Text>
                </>
              )}
            </div>
          ) : scheduleRecurrence ? (
            <Text variant="small" tone="secondary" className="mt-1">
              {scheduleRecurrence}
            </Text>
          ) : null}
        </div>
      </div>
    </div>
  );
}
