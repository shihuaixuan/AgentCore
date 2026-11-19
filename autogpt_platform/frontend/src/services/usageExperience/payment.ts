import { formatTierLabel } from "@/app/(platform)/copilot/components/usageHelpers";
import type { Locale } from "@/lib/i18n/locale";
import {
  formatOfferPrice,
  formatTrialDate,
  type UsageExperience,
} from "./helpers";

export function formatPaymentDue(
  payment: UsageExperience["payment"],
  locale: Locale = "en",
) {
  if (!payment) return null;
  const amount = formatOfferPrice(payment.amount_due, payment.currency);
  if (!amount) return null;
  const plan = formatTierLabel(payment.plan) ?? "Your plan";
  const date = formatTrialDate(payment.startsOn);
  if (locale === "zh-CN") {
    const planLabel = formatTierLabel(payment.plan, locale) ?? "你的套餐";
    const startDate = payment.startsOn ? new Date(payment.startsOn) : null;
    const start =
      startDate && Number.isFinite(startDate.getTime())
        ? startDate.toLocaleDateString("zh-CN", {
            ...(startDate.getFullYear() !== new Date().getFullYear()
              ? { year: "numeric" as const }
              : {}),
            month: "long",
            day: "numeric",
          })
        : null;
    return {
      url: payment.payment_url,
      actionLabel: `立即支付 ${amount}`,
      description: `${planLabel} 原定${start ? `于 ${start}` : "现在"}开始，但 ${amount} 扣款未成功。支付后即可立即启用。你的对话、工作流和成果已保存。`,
    };
  }
  return {
    url: payment.payment_url,
    actionLabel: `Pay ${amount} now`,
    description: `${plan} was due to start${date ? ` on ${date}` : ""}, but the ${amount} charge didn’t go through. Pay now and ${plan === "Your plan" ? "your plan" : plan} starts right away. Your chats, workflows and results are saved.`,
  };
}
