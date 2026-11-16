import type { ActivationTerms } from "@/app/api/__generated__/models/activationTerms";
import { formatAmount } from "@/services/pro-activation/helpers";
import * as english from "@/services/pro-activation/reviewDetails";

export function intervalText(terms: ActivationTerms) {
  const count = terms.billing_interval_count ?? 1;
  const unit = terms.billing_interval === "year" ? "年" : "个月";
  return `${count}${unit}`;
}

export function billingCadence(terms: ActivationTerms, locale: string) {
  return locale === "zh-CN"
    ? `每${intervalText(terms)}`
    : english.billingCadence(terms);
}

export function trialEndNotice(terms: ActivationTerms, locale: string) {
  if (locale !== "zh-CN") return english.trialEndNotice(terms);
  const plan = terms.plan === "MAX" ? "Max" : "Pro";
  if (!terms.trial_ends_at || !terms.period_starts_at)
    return `启用 ${plan} 会提前结束免费试用，付费计费周期将在你确认时开始。`;
  const billingDay =
    terms.billing_interval === "year"
      ? new Date(terms.period_starts_at).toLocaleDateString("zh-CN", {
          month: "long",
          day: "numeric",
        })
      : `每月 ${new Date(terms.period_starts_at).getDate()} 日`;
  return `你的免费试用将立即结束，而非原定的 ${new Date(terms.trial_ends_at).toLocaleDateString("zh-CN")}，账单日期将调整为${billingDay}。`;
}

export function nextPaymentDescription(terms: ActivationTerms, locale: string) {
  if (locale !== "zh-CN") return english.nextPaymentDescription(terms);
  const amount = formatAmount(terms.renewal_unit_amount, terms.currency);
  const discounted = terms.renewal_discounts?.some(
    (discount) => discount.duration !== "once",
  );
  const price = discounted
    ? `下次付款以续订折扣前的 ${amount} 为基础计算`
    : `下次付款金额为 ${amount}`;
  const tax =
    terms.renewal_tax?.price_tax_behavior === "inclusive"
      ? "，已含税"
      : "，另加税费";
  return `${price}${tax}，之后每${intervalText(terms)}续订一次。`;
}
