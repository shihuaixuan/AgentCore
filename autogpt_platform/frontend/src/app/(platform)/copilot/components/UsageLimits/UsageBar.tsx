"use client";

import { useTranslation } from "@/lib/i18n/LanguageProvider";

import { useReadEveryRender } from "@/hooks/useReadEveryRender";
import { Text } from "@/components/atoms/Text/Text";
import { formatResetTime } from "../usageHelpers";

interface Props {
  label: string;
  percentUsed: number;
  resetsAt: Date | string;
}

export function UsageBar({ label, percentUsed, resetsAt }: Props) {
  const { t } = useTranslation();
  const percent = Math.min(100, Math.max(0, Math.round(percentUsed)));
  const isHigh = percent >= 80;
  const percentLabel =
    percentUsed > 0 && percent === 0
      ? t("<1% used", "已用不足 1%")
      : t(`${percent}% used`, `已用 ${percent}%`);
  // Relative to the clock, so read on every render rather than cached.
  const resetLabel = useReadEveryRender(() => formatResetTime(resetsAt));

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-baseline justify-between">
        <Text tone="body" variant="body-medium">
          {label}
        </Text>
        <Text variant="body" tone="muted" tabular>
          {percentLabel}
        </Text>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-surface-active">
        <div
          role="progressbar"
          aria-label={t(`${label} usage`, `${label}用量`)}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={percent}
          className={`h-full rounded-full transition-[width] duration-300 ease-out ${
            isHigh ? "bg-orange" : "bg-info"
          }`}
          style={{ width: `${Math.max(percent > 0 ? 1 : 0, percent)}%` }}
        />
      </div>
      <Text tone="muted" variant="small">
        {t(`Resets ${resetLabel}`, `${resetLabel}重置`)}
      </Text>
    </div>
  );
}
