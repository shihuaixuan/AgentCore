"use client";

import { useTranslation } from "@/lib/i18n/LanguageProvider";
import { ArrowUpRight01Icon } from "@hugeicons/core-free-icons";
import { Badge } from "@/components/atoms/Badge/Badge";
import { Button } from "@/components/atoms/Button/Button";
import { Icon } from "@/components/atoms/Icon/Icon";
import { Text } from "@/components/atoms/Text/Text";
import {
  formatActivityDate,
  statusLabel,
  taskHref,
  type Transaction,
} from "../helpers";

type Props = { transaction: Transaction };

export function ReceiptMetadata({ transaction }: Props) {
  const { t, locale } = useTranslation();
  const started = formatActivityDate(
    transaction.execution_started_at,
    t,
    locale,
  );
  const posted = formatActivityDate(transaction.transaction_time, t, locale);
  const cutoff = formatActivityDate(transaction.receipt_as_of, t, locale);
  return (
    <div className="mt-4 flex flex-wrap items-end justify-between gap-4 border-t border-border-base pt-4">
      <div className="flex flex-wrap gap-x-6 gap-y-3">
        {transaction.execution_status && (
          <div className="flex flex-col items-start gap-1">
            <Text variant="small" tone="secondary">
              {t("Run status", "运行状态")}
            </Text>
            <Badge
              variant={
                transaction.execution_status === "COMPLETED"
                  ? "success"
                  : transaction.execution_status === "FAILED"
                    ? "error"
                    : "info"
              }
              size="small"
            >
              {statusLabel(transaction.execution_status, t)}
            </Badge>
          </div>
        )}
        {transaction.execution_started_at && (
          <MetadataField
            label={t("Started", "开始时间")}
            value={`${started.date} · ${started.time}`}
            title={started.full}
          />
        )}
        {transaction.execution_graph_version != null && (
          <MetadataField
            label={t("Version", "版本")}
            value={`v${transaction.execution_graph_version}`}
          />
        )}
        <MetadataField
          label={t("Last activity", "最近活动")}
          value={`${posted.date} · ${posted.time}`}
          title={posted.full}
        />
        {transaction.receipt_as_of && (
          <MetadataField
            label={t("Credits as of", "积分统计截至")}
            value={`${cutoff.date} · ${cutoff.time}`}
            title={cutoff.full}
          />
        )}
      </div>
      <ReceiptDestination transaction={transaction} />
    </div>
  );
}

function MetadataField({
  label,
  value,
  title,
}: {
  label: string;
  value: string;
  title?: string;
}) {
  return (
    <div className="flex flex-col gap-1">
      <Text variant="small" tone="secondary">
        {label}
      </Text>
      <Text variant="small" title={title}>
        {value}
      </Text>
    </div>
  );
}

function ReceiptDestination({ transaction }: Props) {
  const { t } = useTranslation();
  const href = taskHref(transaction);
  const conversationHref = transaction.conversation_id
    ? `/copilot?sessionId=${encodeURIComponent(transaction.conversation_id)}`
    : null;
  if (href || conversationHref) {
    return (
      <Button
        as="NextLink"
        href={href || conversationHref || ""}
        variant="secondary"
        size="small"
        className="min-h-11 min-w-0"
        rightIcon={<Icon icon={ArrowUpRight01Icon} size={16} />}
      >
        {href ? t("View task", "查看任务") : t("View conversation", "查看对话")}
      </Button>
    );
  }
  if (transaction.activity_type === "agent_run") {
    const label = transaction.library_agent_id
      ? t("Run unavailable", "运行不可用")
      : transaction.execution_available
        ? t("Not in your library", "不在你的工作流库中")
        : t("Workflow and run unavailable", "工作流和运行均不可用");
    return (
      <Text variant="small" tone="secondary">
        {label}
      </Text>
    );
  }
  if (transaction.activity_type === "copilot_tools")
    return (
      <Text variant="small" tone="secondary">
        {t("Conversation unavailable", "对话不可用")}
      </Text>
    );
  return null;
}
