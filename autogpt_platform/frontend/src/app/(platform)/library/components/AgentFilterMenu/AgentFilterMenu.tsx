"use client";

import { useTranslation } from "@/lib/i18n/LanguageProvider";
import type { SelectOption } from "@/components/atoms/Select/Select";
import { Select } from "@/components/atoms/Select/Select";
import type { AgentStatusFilter, FleetSummary } from "../../types";
import { FunnelIcon } from "@hugeicons/core-free-icons";
import { Icon } from "@/components/atoms/Icon/Icon";

interface Props {
  value: AgentStatusFilter;
  onChange: (value: AgentStatusFilter) => void;
  summary: FleetSummary;
}

function buildOptions(summary: FleetSummary): SelectOption[] {
  return [
    { value: "all", label: "All Workflows" },
    { value: "running", label: `Running (${summary.running})` },
    { value: "attention", label: `Needs Attention (${summary.error})` },
    { value: "listening", label: `Listening (${summary.listening})` },
    { value: "scheduled", label: `Scheduled (${summary.scheduled})` },
    { value: "idle", label: `Idle / Stale (${summary.idle})` },
    { value: "healthy", label: "Healthy" },
  ];
}

export function AgentFilterMenu({ value, onChange, summary }: Props) {
  const { t } = useTranslation();
  function handleChange(val: string) {
    onChange(val as AgentStatusFilter);
  }

  const labels: Record<string, string> = {
    all: "全部工作流",
    running: "运行中",
    attention: "需要处理",
    listening: "监听中",
    scheduled: "已计划",
    idle: "空闲 / 长期未运行",
    healthy: "正常",
  };
  const options = buildOptions(summary).map((option) => ({
    ...option,
    label: t(
      option.label,
      labels[option.value] +
        (option.value === "all" || option.value === "healthy"
          ? ""
          : " " + (option.label.match(/\(.*\)/)?.[0] ?? "")),
    ),
  }));

  return (
    <div className="flex items-center" data-testid="agent-filter-dropdown">
      <span className="hidden text-body whitespace-nowrap text-foreground-tertiary sm:inline">
        {t("filter", "筛选")}
      </span>
      <Icon icon={FunnelIcon} className="ml-1 h-4 w-4 sm:hidden" />
      <Select
        id="agent-status-filter"
        label={t("Filter workflows", "筛选工作流")}
        hideLabel
        value={value}
        onValueChange={handleChange}
        options={options}
        size="small"
        // oxlint-disable-next-line design-system/no-restyle -- Select has no inline link-style trigger variant
        className="ml-1 w-fit border-none !bg-transparent text-body underline underline-offset-4 shadow-none"
        wrapperClassName="mb-0"
      />
    </div>
  );
}
