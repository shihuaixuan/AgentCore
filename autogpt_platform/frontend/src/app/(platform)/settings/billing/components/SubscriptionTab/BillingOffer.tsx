"use client";

import { AUTOPILOT_NAME } from "@/lib/branding";
import { useTranslation } from "@/lib/i18n/LanguageProvider";
import { BillingPlanOffer } from "./BillingPlanOffer";
import { SupportOffer } from "./SupportOffer";
import { useProActivation } from "@/services/pro-activation/useProActivation";
import { useUsageExperience } from "@/services/usageExperience/useUsageExperience";
import {
  formatOfferPrice,
  formatTrialStartDescription,
  formatTrialStartTitle,
  getFeaturedUsagePercent,
  getUsageStatus,
} from "@/services/usageExperience/helpers";
import { formatCents } from "../../helpers";
import {
  ENTERPRISE_CONTACT_URL,
  TEAM_UPGRADE_URL,
  useYourPlanCard,
} from "./YourPlanCard/useYourPlanCard";

interface Props {
  controller?: ReturnType<typeof useYourPlanCard>;
}

export function BillingOffer({ controller }: Props) {
  const { t } = useTranslation();
  const { experience, trial, subscription, usage } = useUsageExperience();
  const activation = useProActivation();
  const isTrial = experience.isActiveTrial;
  const target = isTrial
    ? trial?.offer?.tier === "PRO"
      ? "Pro"
      : null
    : controller?.plan?.nextTierLabel;
  const canUpgrade = isTrial
    ? target === "Pro"
    : controller?.canUpgrade && !controller.plan?.nextTierIsTeamLink;
  if (activation.isReady && experience.tier === "PRO")
    return (
      <SupportOffer
        eyebrow="AutoGPT Pro"
        title={t("Pro is active", "Pro 已启用")}
        description={t(
          "Pro is active. Pick up where you left off with your conversations and workflows.",
          "Pro 已启用。继续之前的对话和工作流。",
        )}
        label={t("Back to your work", "返回你的工作")}
        href="/copilot"
        ready
      />
    );
  if (!canUpgrade || !target)
    return (
      <SupportOffer
        eyebrow={t("Your plan", "你的套餐")}
        title={t("Need more capacity?", "需要更多容量？")}
        description={
          experience.tier === "ENTERPRISE"
            ? t(
                "For additional capacity or changes to your plan, your account team is ready to help.",
                "如需增加容量或更改套餐，你的客户团队随时可以提供帮助。",
              )
            : t(
                "When your work calls for more capacity, talk with us about what you need.",
                "当工作需要更多容量时，请联系我们讨论你的需求。",
              )
        }
        label={
          experience.tier === "ENTERPRISE"
            ? t("Contact account team", "联系客户团队")
            : t("Contact us", "联系我们")
        }
        href={
          experience.tier === "MAX" ? TEAM_UPGRADE_URL : ENTERPRISE_CONTACT_URL
        }
      />
    );
  const price =
    isTrial && trial?.offer
      ? `${formatOfferPrice(trial.offer.unit_amount, trial.offer.currency)} / ${trial.offer.billing_cycle === "yearly" ? t("year", "年") : t("month", "月")}`
      : controller?.offerPriceCents !== undefined
        ? `${formatCents(controller.offerPriceCents)} / ${controller.plan?.billingCycle === "yearly" ? t("year", "年") : t("month", "月")}`
        : null;
  const multipliers = subscription?.tier_multipliers;
  const multiplier =
    multipliers?.MAX && multipliers?.PRO
      ? Math.round((multipliers.MAX / multipliers.PRO) * 10) / 10
      : null;
  const benefits = isTrial
    ? [
        t(
          "A full daily and weekly allowance once payment goes through",
          "支付成功后即可获得完整的每日和每周额度",
        ),
        t(
          "Your chats, workflows and files stay where they are",
          "你的聊天、工作流和文件将保留原位",
        ),
      ]
    : target === "Max"
      ? [
          multiplier
            ? t(`${multiplier}× the usage of Pro`, `Pro ${multiplier} 倍的用量`)
            : t("More room for demanding work", "更多用量，满足高负载工作需求"),
          t(
            "More workspace storage and priority support",
            "更多工作区存储空间和优先支持",
          ),
        ]
      : [
          t(
            `Experts for content, sales and research, with ${AUTOPILOT_NAME} coordinating`,
            `由 ${AUTOPILOT_NAME} 协调的内容、销售和研究专家`,
          ),
          t(
            "Workflows that keep working in the background on a schedule",
            "按计划在后台持续运行的工作流",
          ),
        ];
  const quiet =
    isTrial &&
    getUsageStatus(getFeaturedUsagePercent(experience, usage)) === "plenty";
  const trialEnd = experience.trialEndsAt
    ? new Date(experience.trialEndsAt)
    : null;
  const trialEndDate =
    trialEnd && Number.isFinite(trialEnd.getTime())
      ? trialEnd.toLocaleDateString("zh-CN", { month: "short", day: "numeric" })
      : null;
  const title = quiet
    ? t(
        formatTrialStartTitle(experience.trialEndsAt),
        trialEndDate
          ? `Pro 将于 ${trialEndDate} 启用`
          : "Pro 将在试用结束时启用",
      )
    : isTrial
      ? t("Start Pro now", "立即启用 Pro")
      : t(
          `${experience.tier === "NO_TIER" ? "Start" : "Upgrade to"} ${target}`,
          `${experience.tier === "NO_TIER" ? "开始使用" : "升级至"} ${target}`,
        );
  return (
    <BillingPlanOffer
      target={target}
      title={title}
      quiet={quiet}
      description={
        isTrial && experience.freshProUsage
          ? quiet
            ? t(
                "Your trial keeps going until then. You can also start today.",
                "试用将持续至该时间。你也可以今天就开始订阅。",
              )
            : t(
                formatTrialStartDescription(experience.trialEndsAt),
                trialEndDate
                  ? `Pro 将于 ${trialEndDate} 自动启用。立即启用即可在今天继续工作。`
                  : "Pro 将在试用结束时自动启用。立即启用即可在今天继续工作。",
              )
          : undefined
      }
      price={price}
      benefits={benefits}
      actionLabel={
        quiet
          ? t("Start Pro now", "立即启用 Pro")
          : isTrial && price
            ? `${title} · ${price.split(" / ")[0]}`
            : title
      }
      onAction={
        isTrial
          ? () => activation.start("/settings/billing")
          : controller?.onUpgrade
      }
      disabled={
        isTrial
          ? activation.isBusy
          : controller?.isUpdatingTier || controller?.isRedirecting
      }
      caption={
        isTrial
          ? t(
              "Starting now ends your trial early. You’ll review the charge first.",
              "立即开始订阅将提前结束试用。付款前你可以先查看费用。",
            )
          : target === "Max"
            ? t(
                "What you’ve already used counts toward Max’s higher limit.",
                "已使用的用量会计入 Max 的更高额度。",
              )
            : t("Review your options before paying.", "付款前先查看可选方案。")
      }
    />
  );
}
