"use client";

import { useTranslation } from "@/lib/i18n/LanguageProvider";
import { Button } from "@/components/atoms/Button/Button";
import { Text } from "@/components/atoms/Text/Text";
import { ExpertAvatar } from "@/components/molecules/ExpertAvatar/ExpertAvatar";
import { SpendRing } from "./components/SpendRing";
import { spendSubtitle, type SpendSummary } from "./helpers";

interface Props {
  summary: SpendSummary;
  pendingAction: "approve" | "reject" | null;
  disabled: boolean;
  onDecide: (approved: boolean) => void;
}

export function SpendApprovalCard({
  summary,
  pendingAction,
  disabled,
  onDecide,
}: Props) {
  const { t } = useTranslation();
  return (
    <div
      data-slot="spend-approval-card"
      className="flex flex-wrap items-center gap-x-4 gap-y-3 rounded-2xl border border-border-base bg-surface py-3 pr-3 pl-4"
    >
      <SpendRing spent={summary.spent} threshold={summary.threshold}>
        <ExpertAvatar
          name={summary.expertName}
          avatarUrl={summary.avatarUrl}
          size={32}
        />
      </SpendRing>
      <div className="min-w-0 flex-1">
        <Text variant="body-semibold" tone="primary">
          {t(
            `${summary.expertName} has done ${summary.spent} credits of work ${summary.period}`,
            `${summary.expertName} ${summary.period === "this week" ? "本周" : "今天"}已完成消耗 ${summary.spent} 积分的工作`,
          )}
        </Text>
        <Text variant="small" tone="muted">
          {t(
            spendSubtitle(summary),
            `已超过你设置的 ${summary.threshold} 积分确认阈值。${summary.waiting === 1 ? "是否继续？" : `有 ${summary.waiting} 个任务等待继续。`}`,
          )}
        </Text>
      </div>
      <div className="ml-auto flex items-center gap-1">
        <Button
          variant="ghost"
          size="small"
          onClick={() => onDecide(false)}
          disabled={disabled}
          loading={pendingAction === "reject"}
        >
          {t("Cancel", "取消")}
        </Button>
        <Button
          variant="primary"
          size="small"
          onClick={() => onDecide(true)}
          disabled={disabled}
          loading={pendingAction === "approve"}
        >
          {t("Keep going", "继续执行")}
        </Button>
      </div>
    </div>
  );
}
