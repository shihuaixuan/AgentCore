import { formatTierLabel } from "@/app/(platform)/copilot/components/usageHelpers";
import { type UsageExperience } from "./helpers";
import { formatPaymentDue } from "./payment";

function chineseDate(value: string | Date | null, includeTime = false) {
  if (!value) return null;
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return null;
  return date.toLocaleString("zh-CN", {
    ...(date.getFullYear() !== new Date().getFullYear()
      ? { year: "numeric" as const }
      : {}),
    month: "long",
    day: "numeric",
    ...(includeTime
      ? { hour: "2-digit" as const, minute: "2-digit" as const }
      : {}),
  });
}

export function chineseUsagePresentation(
  experience: UsageExperience,
  usageMultiplier?: number,
) {
  const { tier, window, isTopTier, isActiveTrial } = experience;
  const date = chineseDate(experience.trialEndsAt);
  if (experience.inactiveTrialStatus) {
    const canceled = experience.inactiveTrialStatus === "canceled";
    const payment = experience.inactiveTrialStatus === "payment_failed";
    const title = payment
      ? "付款未成功"
      : canceled
        ? "试用已取消"
        : "试用已结束";
    return {
      eyebrow: payment
        ? "付款需要处理"
        : canceled
          ? "免费试用 · 已取消"
          : "免费试用 · 已结束",
      title,
      noticeTitle: title,
      description: payment
        ? (formatPaymentDue(experience.payment, "zh-CN")?.description ??
          "请检查账单信息以继续使用。你的对话、工作流和成果已保存。")
        : canceled
          ? "试用不会转为付费订阅。你的对话、工作流和成果已保存，随时可以选择套餐继续。"
          : "你的对话、工作流和成果已保存。选择套餐即可继续使用。",
      supportLabel: "联系支持",
      secondary: "返回工作",
      trialSpent: false,
    };
  }
  const trialSpent = isActiveTrial && window === "trial";
  const reset = chineseDate(experience.resetsAt, true);
  const resume = reset
    ? `你可以在 ${reset} 继续使用`
    : "额度刷新后即可继续使用";
  const title = trialSpent
    ? "试用额度已用完"
    : isTopTier
      ? resume
      : window === "weekly"
        ? "已达到本周使用上限"
        : "已达到今日使用上限";
  return {
    eyebrow: `${formatTierLabel(tier, "zh-CN") ?? "你的套餐"} · ${trialSpent ? "试用额度已用完" : window === "weekly" ? "本周额度已用完" : "今日额度已用完"}`,
    title,
    noticeTitle: title,
    description: trialSpent
      ? experience.freshProUsage
        ? `Pro 将于${date ? ` ${date}` : "试用结束时"}自动开始。现在启动即可继续今天的工作。`
        : "选择下一个套餐即可继续使用。你的对话、工作流和成果已保存。"
      : isTopTier
        ? "你的对话、工作流和成果已保存。"
        : !experience.resetsAt
          ? "选择套餐即可继续使用。你的对话、工作流和成果已保存。"
          : tier === "PRO"
            ? `${resume}，也可以升级到 Max，获得${usageMultiplier ? ` ${usageMultiplier} 倍` : "更多"}额度。`
            : `${resume}，也可以${tier === "BASIC" ? "升级到" : "开始使用"} Pro。`,
    supportLabel:
      tier === "ENTERPRISE"
        ? "联系客户团队"
        : tier === "BUSINESS"
          ? "联系支持"
          : "联系我们",
    secondary: trialSpent
      ? experience.freshProUsage && date
        ? `等到 ${date}`
        : "返回工作"
      : experience.resetsAt
        ? "等待额度重置"
        : "返回工作",
    trialSpent,
  };
}
