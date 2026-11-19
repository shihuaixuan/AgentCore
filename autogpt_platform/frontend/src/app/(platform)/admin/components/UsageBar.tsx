"use client";

import type { CSSProperties } from "react";
import { formatMicrodollarsAsUsd } from "@/app/(platform)/copilot/components/usageHelpers";
import { useTranslation } from "@/lib/i18n/LanguageProvider";

export function UsageBar({ used, limit }: { used: number; limit: number }) {
  const { t } = useTranslation();
  if (limit === 0) {
    return (
      <span className="text-body text-foreground-tertiary">
        {t("Unlimited", "不限额")}
      </span>
    );
  }
  const pct = Math.min(Math.max(0, (used / limit) * 100), 100);
  const color = pct >= 90 ? "bg-error" : pct >= 70 ? "bg-yellow" : "bg-success";

  return (
    <div className="space-y-1">
      <div className="flex justify-between text-body">
        <span>
          {formatMicrodollarsAsUsd(used)} {t("spent", "已消费")}
        </span>
        <span>
          {formatMicrodollarsAsUsd(limit)} {t("limit", "限额")}
        </span>
      </div>
      <div className="h-2 w-full rounded-full bg-surface-active">
        <div
          className={`h-2 w-[var(--usage-width)] rounded-full ${color}`}
          style={{ "--usage-width": `${pct}%` } as CSSProperties}
        />
      </div>
      <div className="text-right text-caption text-foreground-tertiary">
        {pct.toFixed(1)}% {t("used", "已使用")}
      </div>
    </div>
  );
}
