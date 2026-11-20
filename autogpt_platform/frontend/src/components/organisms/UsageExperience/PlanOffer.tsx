"use client";

import { AUTOPILOT_NAME } from "@/lib/branding";
import {
  ArrowRight02Icon,
  SparklesIcon,
  Tick02Icon,
} from "@hugeicons/core-free-icons";
import { Button } from "@/components/atoms/Button/Button";
import { Icon } from "@/components/atoms/Icon/Icon";
import { Text } from "@/components/atoms/Text/Text";
import { formatOfferPrice } from "@/services/usageExperience/helpers";
import { useTranslation } from "@/lib/i18n/LanguageProvider";

interface Props {
  tier: "PRO" | "MAX";
  price?: number;
  currency?: string;
  cycle?: "monthly" | "yearly";
  usageMultiplier?: number;
  storageMultiplier?: number;
  freshUsage?: boolean;
  actionLabel?: string;
  onUpgrade: () => void;
  disabled?: boolean;
}

export function PlanOffer({
  tier,
  price,
  currency = "USD",
  cycle = "monthly",
  usageMultiplier,
  storageMultiplier,
  freshUsage = false,
  actionLabel,
  onUpgrade,
  disabled = false,
}: Props) {
  const { t } = useTranslation();
  const name = tier === "PRO" ? "Pro" : "Max";
  const amount = formatOfferPrice(price, currency);
  const features =
    tier === "PRO"
      ? [
          freshUsage
            ? t(
                "A full daily and weekly allowance once payment goes through",
                "付款成功后即可获得完整的每日和每周额度",
              )
            : t(
                `Experts for content, sales and research, with ${AUTOPILOT_NAME} coordinating`,
                `由 ${AUTOPILOT_NAME} 协调的内容、销售和研究专家`,
              ),
          freshUsage
            ? t(
                "Your chats, workflows and files stay where they are",
                "你的对话、工作流和文件将保留在原处",
              )
            : t(
                "Workflows that keep working in the background on a schedule",
                "按计划在后台持续运行的工作流",
              ),
        ]
      : [
          usageMultiplier
            ? t(
                `${usageMultiplier}× the usage of Pro`,
                `用量额度为 Pro 的 ${usageMultiplier} 倍`,
              )
            : t(
                "More room for your daily and weekly work",
                "为每日和每周工作提供更多额度",
              ),
          storageMultiplier
            ? t(
                `${storageMultiplier}× the workspace storage`,
                `工作空间存储容量提升至 ${storageMultiplier} 倍`,
              )
            : t("More workspace storage", "更多工作空间存储容量"),
          t("Priority support", "优先客服支持"),
        ];
  return (
    <section
      aria-label={t(`${name} plan`, `${name} 套餐`)}
      data-slot="plan-offer"
      className="rounded-2xl border border-brand/30 bg-gradient-to-br from-accent-surface via-surface to-info-surface p-5 sm:p-6"
    >
      <div
        data-slot="plan-offer-header"
        className="mb-5 flex items-start justify-between gap-3"
      >
        <div
          data-slot="plan-offer-identity"
          className="flex min-w-0 items-center gap-3"
        >
          <span
            data-slot="plan-offer-icon"
            className="hidden size-10 shrink-0 items-center justify-center rounded-xl border border-brand/30 bg-surface text-brand min-[360px]:flex"
          >
            <Icon icon={SparklesIcon} size={20} />
          </span>
          <div data-slot="plan-offer-heading">
            <Text variant="h4" className="!text-lead">
              {name}
            </Text>
            <Text variant="small" tone="muted">
              {cycle === "yearly"
                ? t("Billed yearly", "按年计费")
                : t("Billed monthly", "按月计费")}
            </Text>
          </div>
        </div>
        {amount && (
          <div data-slot="plan-offer-price" className="shrink-0 text-right">
            <Text variant="h4" className="!text-heading-md">
              {amount}
            </Text>
            <Text variant="small" tone="muted">
              {cycle === "yearly"
                ? t("per year + tax", "每年，另加税费")
                : t("per month + tax", "每月，另加税费")}
            </Text>
          </div>
        )}
      </div>
      <ul data-slot="plan-offer-features" className="mb-5 space-y-2.5">
        {features.map((feature) => (
          <li
            key={feature}
            data-slot="plan-offer-feature"
            className="flex gap-2.5 text-body leading-5 text-foreground-body"
          >
            <Icon
              icon={Tick02Icon}
              size={16}
              tone="brand"
              className="mt-0.5 shrink-0"
            />
            {feature}
          </li>
        ))}
      </ul>
      <Button
        className="w-full"
        onClick={onUpgrade}
        disabled={disabled}
        rightIcon={<Icon icon={ArrowRight02Icon} size={16} />}
      >
        {actionLabel ??
          (tier === "MAX"
            ? t("Upgrade to Max", "升级至 Max")
            : freshUsage
              ? t(
                  `Start Pro now${amount ? ` · ${amount}` : ""}`,
                  `立即启用 Pro${amount ? ` · ${amount}` : ""}`,
                )
              : t("Start Pro", "启用 Pro"))}
      </Button>
      <Text variant="small-tight" tone="muted" align="center" className="mt-3">
        {freshUsage
          ? t(
              "You’ll see the full charge before you pay.",
              "付款前你将看到完整费用。",
            )
          : tier === "MAX"
            ? t(
                "What you’ve already used counts toward Max’s higher limit.",
                "已使用的额度将计入 Max 更高的额度上限。",
              )
            : t(
                "Review your plan and payment before confirming.",
                "请在确认前核对套餐和付款信息。",
              )}
      </Text>
    </section>
  );
}
