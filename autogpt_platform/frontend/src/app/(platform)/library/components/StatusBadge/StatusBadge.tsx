"use client";

import { cn } from "@/lib/utils";
import type { AgentStatus } from "../../types";
import { useTranslation } from "@/lib/i18n/LanguageProvider";

const STATUS_CONFIG: Record<
  AgentStatus,
  { label: string; bg: string; text: string; pulse: boolean }
> = {
  running: {
    label: "Running",
    bg: "",
    text: "text-info-foreground",
    pulse: true,
  },
  error: {
    label: "Error",
    bg: "",
    text: "text-error",
    pulse: false,
  },
  listening: {
    label: "Listening",
    bg: "",
    text: "text-brand",
    pulse: true,
  },
  scheduled: {
    label: "Scheduled",
    bg: "",
    text: "text-yellow-foreground",
    pulse: false,
  },
  idle: {
    label: "Idle",
    bg: "",
    text: "text-foreground-tertiary",
    pulse: false,
  },
};

interface Props {
  status: AgentStatus;
  className?: string;
}

export function StatusBadge({ status, className }: Props) {
  const { t } = useTranslation();
  const labels: Record<AgentStatus, string> = {
    running: "运行中",
    error: "错误",
    listening: "监听中",
    scheduled: "已计划",
    idle: "空闲",
  };
  const config = STATUS_CONFIG[status];

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-caption font-medium",
        config.bg,
        config.text,
        className,
      )}
    >
      <span
        className={cn(
          "inline-block h-1.5 w-1.5 rounded-full",
          config.pulse && "animate-pulse",
          statusDotColor(status),
        )}
      />
      {t(config.label, labels[status])}
    </span>
  );
}

function statusDotColor(status: AgentStatus): string {
  switch (status) {
    case "running":
      return "bg-info";
    case "error":
      return "bg-error";
    case "listening":
      return "bg-brand";
    case "scheduled":
      return "bg-yellow";
    case "idle":
      return "bg-foreground-subtle";
  }
}
