"use client";

import { useTranslation } from "@/lib/i18n/LanguageProvider";
import type { ActivationTerms } from "@/app/api/__generated__/models/activationTerms";
import type { RenewalDiscount } from "@/app/api/__generated__/models/renewalDiscount";
import { Text } from "@/components/atoms/Text/Text";
import { formatAmount } from "@/services/pro-activation/helpers";

function discountText(
  discount: RenewalDiscount,
  currency: string,
  locale: string,
) {
  if (locale === "zh-CN") {
    const amount =
      discount.percent_off != null
        ? `减免 ${discount.percent_off}%`
        : discount.amount_off != null
          ? `减免 ${formatAmount(discount.amount_off, discount.currency ?? currency)}`
          : "优惠折扣";
    const duration =
      discount.duration === "once"
        ? "仅适用于首张账单"
        : discount.duration === "forever"
          ? "每次续订均适用"
          : discount.duration_in_months
            ? `持续 ${discount.duration_in_months} 个月`
            : "优惠期间适用";
    return `${amount}，${duration}${discount.ends_at ? ` · 截至 ${new Date(discount.ends_at * 1000).toLocaleDateString("zh-CN")}` : ""}`;
  }
  const amount =
    discount.percent_off != null
      ? `${discount.percent_off}% off`
      : discount.amount_off != null
        ? `${formatAmount(discount.amount_off, discount.currency ?? currency)} off`
        : "Offer discount";
  const duration =
    discount.duration === "once"
      ? "the first invoice only"
      : discount.duration === "forever"
        ? "every renewal"
        : discount.duration_in_months
          ? `for ${discount.duration_in_months} months`
          : "for the offer period";
  return `${amount} ${duration}${discount.ends_at ? ` · ends ${new Date(discount.ends_at * 1000).toLocaleDateString()}` : ""}`;
}

interface Props {
  terms: ActivationTerms;
}

export function RenewalDetails({ terms }: Props) {
  const { t, locale } = useTranslation();
  return (
    <div data-slot="renewal-details" className="space-y-2">
      {terms.renewal_discounts?.map((discount, index) => (
        <Text key={index} variant="small" tone="secondary">
          {discountText(discount, terms.currency, locale)}
        </Text>
      ))}
      <details
        data-slot="renewal-details-terms"
        className="group text-body text-foreground-tertiary"
      >
        <summary
          data-slot="renewal-details-terms-toggle"
          className="w-fit cursor-pointer rounded-small underline decoration-border-strong underline-offset-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand"
        >
          {t("Full renewal terms", "完整续订条款")}
        </summary>
        <Text variant="small-relaxed" tone="secondary" className="mt-3">
          {terms.renewal_terms}
        </Text>
        {terms.renewal_tax?.rates?.map((rate, index) => (
          <Text key={index} variant="small" tone="secondary" className="mt-2">
            {rate.display_name}: {rate.percentage}%{" "}
            {rate.inclusive ? t("included", "已包含") : t("additional", "另加")}
            {[rate.country, rate.state].filter(Boolean).length
              ? ` · ${[rate.country, rate.state].filter(Boolean).join(", ")}`
              : ""}
          </Text>
        ))}
      </details>
    </div>
  );
}
