import { Text } from "@/components/atoms/Text/Text";
import { budgetLowHint } from "@/services/usageExperience/budget";
import type { UsageSnapshot } from "@/services/usageExperience/useUsageExperience";
import { cn } from "@/lib/utils";
import { BudgetRing } from "./BudgetRing";
import { useTipMoment } from "@/app/(platform)/components/ContextualTips/useTipMoment";
import { useTranslation } from "@/lib/i18n/LanguageProvider";

interface Props {
  usage: UsageSnapshot;
  className?: string;
}

const WINDOW_LABEL = {
  daily: "Today",
  weekly: "This week",
  trial: "Trial allowance",
} as const;

export function BudgetLowHint({ usage, className }: Props) {
  const { t } = useTranslation();
  const { budget, experience } = usage;
  // The window running low, or nothing while the budget is fine.
  const lowWindow = budget.state === "low" ? budget.window : null;
  // Running low is the moment the allowance matters, if Otto never said so.
  useTipMoment("first-cost", lowWindow !== null);
  if (!lowWindow) return null;
  const trialPercent = experience.isLifetimeTrial
    ? experience.trialPercent
    : null;
  const percent =
    lowWindow === "trial"
      ? (trialPercent ?? budget.percentUsed)
      : budget.percentUsed;
  if (percent === null) return null;
  return (
    <div
      aria-label={t("Budget running low", "额度即将用尽")}
      className={cn(
        "mx-auto mt-2 flex w-full items-center gap-2 px-3 text-left",
        className,
      )}
    >
      <BudgetRing
        label={t(
          WINDOW_LABEL[lowWindow],
          lowWindow === "daily"
            ? "今日"
            : lowWindow === "weekly"
              ? "本周"
              : "试用额度",
        )}
        percent={percent}
      />
      <Text tone="muted" variant="small-tight">
        {t(
          budgetLowHint(lowWindow, percent),
          `${lowWindow === "trial" ? "试用额度" : lowWindow === "weekly" ? "本周额度" : "今日额度"}约剩余 ${Math.max(1, Math.round(100 - percent))}%。长任务可能会在执行中暂停。`,
        )}
      </Text>
    </div>
  );
}
