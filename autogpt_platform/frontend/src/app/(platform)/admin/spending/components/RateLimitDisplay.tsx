"use client";

import { useState } from "react";
import { Button } from "@/components/atoms/Button/Button";
import type { UserRateLimitResponse } from "@/app/api/__generated__/models/userRateLimitResponse";
import { UsageBar } from "../../components/UsageBar";
import { useTranslation } from "@/lib/i18n/LanguageProvider";

const TIERS = [
  "NO_TIER",
  "BASIC",
  "PRO",
  "MAX",
  "BUSINESS",
  "ENTERPRISE",
] as const;
type Tier = (typeof TIERS)[number];

const TIER_COLORS: Record<Tier, string> = {
  NO_TIER: "bg-error-surface text-error-foreground",
  BASIC: "bg-surface-hover text-foreground-body",
  PRO: "bg-info/20 text-info-foreground",
  MAX: "bg-indigo/15 text-accent-strong",
  BUSINESS: "bg-accent-surface text-accent-strong",
  ENTERPRISE: "bg-warning-surface text-warning-foreground",
};

interface Props {
  data: UserRateLimitResponse;
  onReset: (resetWeekly: boolean) => Promise<void>;
  /** Override the outer container classes (default: bordered card). */
  className?: string;
}

export function RateLimitDisplay({ data, onReset, className }: Props) {
  const { t } = useTranslation();
  function tierLabel(tier: Tier) {
    return tier === "NO_TIER"
      ? t("no access (paywalled)", "无权限（需付费）")
      : t("tier limits", "套餐限额");
  }
  const [isResetting, setIsResetting] = useState(false);
  const [resetWeekly, setResetWeekly] = useState(false);

  const currentTier = TIERS.includes(data.tier as Tier)
    ? (data.tier as Tier)
    : "NO_TIER";

  async function handleReset() {
    const msg = resetWeekly
      ? "Reset both daily and weekly usage counters to zero?"
      : "Reset daily usage counter to zero?";
    if (!window.confirm(msg)) return;

    setIsResetting(true);
    try {
      await onReset(resetWeekly);
    } finally {
      setIsResetting(false);
    }
  }

  const nothingToReset = resetWeekly
    ? data.daily_cost_used_microdollars === 0 &&
      data.weekly_cost_used_microdollars === 0
    : data.daily_cost_used_microdollars === 0;

  return (
    <div className={className ?? "rounded-md border bg-surface p-6"}>
      <div className="mb-4 flex items-start justify-between">
        <div>
          <h2 className="mb-1 text-lead font-semibold">
            {t("Rate Limits for", "限额：")} {data.user_email ?? data.user_id}
          </h2>
          {data.user_email && (
            <p className="text-caption text-foreground-tertiary">
              {t("User ID", "用户 ID")}：{data.user_id}
            </p>
          )}
        </div>
        <span
          className={`rounded-full px-3 py-1 text-caption font-medium ${TIER_COLORS[currentTier] ?? "bg-surface-hover text-foreground-body"}`}
        >
          {currentTier}
        </span>
      </div>

      <div className="mb-4 flex items-center gap-3">
        <label className="text-body font-medium text-foreground-body">
          {t("Subscription Tier", "订阅套餐")}
        </label>
        <select
          aria-label={t("Subscription tier", "订阅套餐")}
          value={currentTier}
          className="rounded-md border bg-surface px-3 py-1.5 text-body"
          disabled
        >
          {TIERS.map((tier) => (
            <option key={tier} value={tier}>
              {tier} — {tierLabel(tier)}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="space-y-2">
          <h3 className="text-body font-medium text-foreground-body">
            {t("Daily Spend", "每日消费")}
          </h3>
          <UsageBar
            used={data.daily_cost_used_microdollars}
            limit={data.daily_cost_limit_microdollars}
          />
        </div>
        <div className="space-y-2">
          <h3 className="text-body font-medium text-foreground-body">
            {t("Weekly Spend", "每周消费")}
          </h3>
          <UsageBar
            used={data.weekly_cost_used_microdollars}
            limit={data.weekly_cost_limit_microdollars}
          />
        </div>
      </div>

      <div className="mt-6 flex items-center gap-3 border-t pt-4">
        <select
          aria-label={t("Reset scope", "重置范围")}
          value={resetWeekly ? "both" : "daily"}
          onChange={(e) => setResetWeekly(e.target.value === "both")}
          className="rounded-md border bg-surface px-3 py-1.5 text-body"
          disabled={isResetting}
        >
          <option value="daily">{t("Reset daily only", "仅重置每日")}</option>
          <option value="both">{t("Reset daily + weekly", "重置每日和每周")}</option>
        </select>
        <Button
          variant="outline"
          onClick={handleReset}
          disabled={isResetting || nothingToReset}
        >
          {isResetting ? t("Resetting...", "正在重置...") : t("Reset Usage", "重置使用量")}
        </Button>
      </div>
    </div>
  );
}
