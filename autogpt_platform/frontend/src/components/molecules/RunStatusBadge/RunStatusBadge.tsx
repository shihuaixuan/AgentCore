"use client";

import { Badge } from "@/components/atoms/Badge/Badge";
import { useTranslation } from "@/lib/i18n/LanguageProvider";

type BadgeVariant = "success" | "error" | "warning" | "info";

interface RunStatusInfo {
  label: string;
  variant: BadgeVariant;
}

interface Props {
  status: string;
}

const STATUS_INFO: Record<string, RunStatusInfo> = {
  COMPLETED: { label: "Completed", variant: "success" },
  FAILED: { label: "Failed", variant: "error" },
  RUNNING: { label: "Running", variant: "info" },
  QUEUED: { label: "Queued", variant: "info" },
  REVIEW: { label: "Waiting for review", variant: "warning" },
  TERMINATED: { label: "Stopped", variant: "info" },
  INCOMPLETE: { label: "Incomplete", variant: "info" },
};

export function getRunStatusInfo(status: string): RunStatusInfo {
  return (
    STATUS_INFO[status.toUpperCase()] ?? {
      label: status,
      variant: "info",
    }
  );
}

export function RunStatusBadge({ status }: Props) {
  const { t } = useTranslation();
  const info = getRunStatusInfo(status);
  const labels: Record<string, string> = {
    COMPLETED: "已完成",
    FAILED: "失败",
    RUNNING: "运行中",
    QUEUED: "排队中",
    REVIEW: "等待审核",
    TERMINATED: "已停止",
    INCOMPLETE: "未完成",
  };
  return (
    <span data-slot="run-status-badge" className="contents">
      <Badge variant={info.variant} size="small">
        {t(info.label, labels[status.toUpperCase()] ?? info.label)}
      </Badge>
    </span>
  );
}
