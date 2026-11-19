"use client";

import { useTranslation } from "@/lib/i18n/LanguageProvider";
import type { SubscriptionUpgradePreview } from "@/app/api/__generated__/models/subscriptionUpgradePreview";
import { Text } from "@/components/atoms/Text/Text";
import { formatAmount } from "@/services/pro-activation/helpers";

interface Props {
  preview: SubscriptionUpgradePreview;
}

export function formatUpgradeAmount(amount: number, currency: string) {
  return formatAmount(amount, currency);
}

function dateLabel(timestamp: number, locale: string) {
  return new Date(timestamp * 1000).toLocaleDateString(locale, {
    month: "short",
    day: "numeric",
  });
}

export function MaxUpgradeSummary({ preview }: Props) {
  const { t, locale } = useTranslation();
  const date = (timestamp: number) => dateLabel(timestamp, locale);
  const amount = (cents: number) =>
    formatUpgradeAmount(cents, preview.currency);
  const unit =
    preview.billing_cycle === "yearly" ? t("year", "年") : t("month", "月");
  const recurringTax = preview.recurring_tax_included
    ? t("including tax", "含税")
    : t("plus applicable tax", "不含适用税费");
  return (
    <div className="overflow-hidden rounded-2xl border border-border-base">
      <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-border-base bg-surface-muted px-5 py-4">
        <Text variant="body-medium">
          Max{" "}
          <span className="font-normal text-foreground-tertiary">
            ·{" "}
            {preview.billing_cycle === "yearly"
              ? t("Yearly", "每年")
              : t("Monthly", "每月")}
          </span>
        </Text>
        <Text variant="small" tone="secondary">
          {amount(preview.recurring_amount)} / {unit}
        </Text>
      </div>
      <div className="space-y-3.5 p-5">
        {preview.lines.map((line, index) => (
          <SummaryRow
            key={index}
            label={
              line.proration
                ? line.amount < 0
                  ? t("Unused Pro time", "Pro 未使用的时段")
                  : t(
                      `Max, ${date(line.period_start)} to ${date(line.period_end)}`,
                      `Max，${date(line.period_start)} 至 ${date(line.period_end)}`,
                    )
                : line.description
            }
            value={amount(line.amount)}
          />
        ))}
        <SummaryRow
          label={
            preview.tax_included
              ? t("Tax (included)", "税费（已含）")
              : t("Tax", "税费")
          }
          value={
            preview.tax_amount == null
              ? t("See invoice", "详见账单")
              : amount(preview.tax_amount)
          }
        />
        {preview.adjustment_amount !== 0 && (
          <SummaryRow
            label={t("Other invoice adjustments", "其他账单调整")}
            value={amount(preview.adjustment_amount)}
          />
        )}
        <div className="border-t border-border-base pt-4">
          <SummaryRow
            label={t("Due today", "今日应付")}
            value={amount(preview.amount_due)}
            emphasized
          />
        </div>
        <div className="pt-2">
          <Text variant="small-loose" tone="secondary">
            {t(
              `Next renewal: ${date(preview.period_end)}. Max’s regular price is ${amount(preview.recurring_amount)} ${recurringTax} per ${unit}, before any applicable discounts or account credits.`,
              `下次续费：${date(preview.period_end)}。Max 的标准价格为每${unit} ${amount(preview.recurring_amount)}（${recurringTax}），尚未扣除适用折扣或账户余额。`,
            )}
          </Text>
        </div>
      </div>
    </div>
  );
}

function SummaryRow({
  label,
  value,
  emphasized = false,
}: {
  label: string;
  value: string;
  emphasized?: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <Text
        variant={emphasized ? "body-medium" : "small"}
        tone={emphasized ? "primary" : "secondary"}
      >
        {label}
      </Text>
      <Text
        variant={emphasized ? "body-medium" : "small"}
        tone={emphasized ? "primary" : "secondary"}
        tabular
        className="shrink-0"
      >
        {value}
      </Text>
    </div>
  );
}
