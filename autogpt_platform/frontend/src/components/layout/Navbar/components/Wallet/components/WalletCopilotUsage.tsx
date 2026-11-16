"use client";

import { useTranslation } from "@/lib/i18n/LanguageProvider";
import { UsageBar } from "@/app/(platform)/copilot/components/UsageLimits/UsageBar";
import { useCopilotUsage } from "@/app/(platform)/copilot/components/UsageLimits/useCopilotUsage";
import {
  formatTierLabel,
  TIER_BADGE_CLASS_NAME,
} from "@/app/(platform)/copilot/components/usageHelpers";
import type { CoPilotUsagePublic } from "@/app/api/__generated__/models/coPilotUsagePublic";
import { Badge } from "@/components/atoms/Badge/Badge";
import { Button } from "@/components/atoms/Button/Button";
import { Progress } from "@/components/atoms/Progress/Progress";
import { Skeleton } from "@/components/atoms/Skeleton/Skeleton";
import { Text } from "@/components/atoms/Text/Text";
import { formatTrialEnd } from "@/components/organisms/TrialCard/helpers";
import { cn } from "@/lib/utils";
import { useTrialStatus } from "@/services/trials/useTrialStatus";

export function WalletCopilotUsage() {
  const { t } = useTranslation();
  const { data: usage, isError, refetch } = useCopilotUsage();
  const tierLabel = formatTierLabel(usage?.tier);

  return (
    <section
      aria-label={t("Chat usage", "对话用量")}
      className="flex flex-col gap-4"
    >
      <div className="flex items-center justify-between gap-3">
        <Text variant="large-medium" as="h2">
          {t("Chat usage", "对话用量")}
        </Text>
        {tierLabel && (
          <Badge variant="info" size="small" className={TIER_BADGE_CLASS_NAME}>
            {tierLabel === "Trial"
              ? t("Free trial", "免费试用")
              : t(`${tierLabel} plan`, `${tierLabel} 套餐`)}
          </Badge>
        )}
      </div>
      {usage ? (
        <UsageWindows usage={usage} />
      ) : isError ? (
        <UsageUnavailable onRetry={() => void refetch()} />
      ) : (
        <UsageLoading />
      )}
    </section>
  );
}

function UsageWindows({ usage }: { usage: CoPilotUsagePublic }) {
  const { t } = useTranslation();
  if (usage.tier === "TRIAL") return <TrialUsage />;
  if (!usage.daily && !usage.weekly) {
    return (
      <Text variant="body" tone="secondary">
        {t("No usage limits", "用量不限")}
      </Text>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {usage.daily && (
        <UsageBar
          label={t("Today", "今天")}
          percentUsed={usage.daily.percent_used}
          resetsAt={usage.daily.resets_at}
        />
      )}
      {usage.weekly && (
        <UsageBar
          label={t("This week", "本周")}
          percentUsed={usage.weekly.percent_used}
          resetsAt={usage.weekly.resets_at}
        />
      )}
    </div>
  );
}

function TrialUsage() {
  const { t } = useTranslation();
  const { data: trial, isPending, refetch } = useTrialStatus();
  if (isPending) return <UsageLoading />;
  if (trial?.allowance_used_percent == null) {
    return <UsageUnavailable onRetry={() => void refetch()} />;
  }

  const percent = Math.min(100, Math.max(0, trial.allowance_used_percent));

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-baseline justify-between gap-3">
        <Text variant="body-medium" tone="body">
          {t("Trial allowance", "试用额度")}
        </Text>
        <Text variant="body" tone="muted" tabular>
          {t(
            `${formatTrialPercent(percent)} used`,
            `已使用 ${formatTrialPercent(percent)}`,
          )}
        </Text>
      </div>
      <Progress
        value={percent}
        role="progressbar"
        aria-label={t("Trial allowance usage", "试用额度用量")}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={percent}
        className={cn(
          "bg-surface-active [&>div]:rounded-full",
          percent >= 80 ? "[&>div]:bg-orange" : "[&>div]:bg-info",
        )}
      />
      <Text variant="small" tone="muted">
        {trial.active ? t("Ends", "结束时间：") : t("Ended", "已结束：")}{" "}
        {formatTrialEnd(trial.ends_at)}
      </Text>
    </div>
  );
}

function formatTrialPercent(percent: number) {
  if (percent > 0 && percent < 0.5) return "<1%";
  if (percent >= 99.5 && percent < 100) {
    return `${Math.floor(percent * 10) / 10}%`;
  }
  return `${Math.round(percent)}%`;
}

function UsageLoading() {
  const { t } = useTranslation();
  return (
    <div
      role="status"
      aria-label={t("Loading chat usage", "正在加载对话用量")}
      className="flex flex-col gap-4"
    >
      {[0, 1].map((index) => (
        <div key={index} aria-hidden="true" className="flex flex-col gap-2">
          <div className="flex justify-between">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-14" />
          </div>
          <Skeleton className="h-2 w-full rounded-full" />
          <Skeleton className="h-3 w-24" />
        </div>
      ))}
    </div>
  );
}

function UsageUnavailable({ onRetry }: { onRetry: () => void }) {
  const { t } = useTranslation();
  return (
    <div className="flex items-center justify-between gap-3">
      <Text variant="small" tone="secondary">
        {t("Usage is unavailable right now.", "暂时无法获取用量。")}
      </Text>
      <Button
        variant="ghost"
        size="xs"
        shape="pill"
        onClick={onRetry}
        className="min-w-20"
      >
        {t("Retry", "重试")}
      </Button>
    </div>
  );
}
