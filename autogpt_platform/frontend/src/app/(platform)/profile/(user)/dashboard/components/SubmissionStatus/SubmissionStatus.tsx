"use client";

import { SubmissionStatus as Status } from "@/app/api/__generated__/models/submissionStatus";
import { useTranslation } from "@/lib/i18n/LanguageProvider";
import { Text } from "@/components/atoms/Text/Text";
import { cn } from "@/lib/utils";

interface Props {
  status: Status;
}

const statusConfig: Record<
  Status,
  { fill: string; dot: string; label: string; chineseLabel: string }
> = {
  [Status.DRAFT]: {
    fill: "bg-info-surface",
    dot: "bg-info",
    label: "Draft",
    chineseLabel: "草稿",
  },
  [Status.PENDING]: {
    fill: "bg-warning-surface",
    dot: "bg-warning",
    label: "Awaiting review",
    chineseLabel: "等待审核",
  },
  [Status.APPROVED]: {
    fill: "bg-success-surface",
    dot: "bg-success",
    label: "Approved",
    chineseLabel: "已通过",
  },
  [Status.REJECTED]: {
    fill: "bg-error-surface",
    dot: "bg-error",
    label: "Rejected",
    chineseLabel: "已拒绝",
  },
};

export function SubmissionStatus({ status }: Props) {
  const { t } = useTranslation();
  const config = statusConfig[status] ?? statusConfig[Status.PENDING];

  return (
    <div
      className={cn(
        "flex items-center gap-1.5 rounded-full px-2.5 py-1",
        config.fill,
      )}
    >
      <div className={cn("h-3 w-3 rounded-full", config.dot)} />
      <Text variant="body-tight" as="div" tone="secondary">
        {t(config.label, config.chineseLabel)}
      </Text>
    </div>
  );
}
