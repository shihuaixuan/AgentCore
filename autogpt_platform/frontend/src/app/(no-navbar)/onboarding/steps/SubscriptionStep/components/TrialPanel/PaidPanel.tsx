"use client";

import { useTranslation } from "@/lib/i18n/LanguageProvider";
import { Text } from "@/components/atoms/Text/Text";
import type { ReactNode } from "react";
import { CheckoutAction } from "./CheckoutAction";
import { getPaidMilestones } from "./helpers";
import { TRIAL_TITLE_ID, TrialPanelShell } from "./TrialPanel";
import { TrialTimeline } from "./TrialTimeline";

interface Props {
  price: string;
  cadence: "month" | "year";
  isProcessing: boolean;
  isBlocked: boolean;
  onContinue: () => void;
  notice?: ReactNode;
}

// No trial to offer: the plan beside a straight Pro checkout.
export function PaidPanel({
  price,
  cadence,
  isProcessing,
  isBlocked,
  onContinue,
  notice,
}: Props) {
  const { t } = useTranslation();
  return (
    <TrialPanelShell>
      <header className="flex flex-col items-start gap-2">
        <Text variant="eyebrow" as="p">
          {t("Pro plan", "Pro 套餐")}
        </Text>
        <Text variant="h3" as="h1" id={TRIAL_TITLE_ID} className="text-balance">
          {t("Start with Pro", "开始使用 Pro")}
        </Text>
        <Text variant="large" tone="secondary" className="text-pretty">
          {t(
            `${price} a ${cadence}, plus any applicable tax. No contract, and you can cancel any time in Settings.`,
            `每${cadence === "year" ? "年" : "月"} ${price}，另加适用税费。无需签约，可随时在设置中取消。`,
          )}
        </Text>
      </header>
      {notice}
      <TrialTimeline
        label={t("How your plan works", "套餐说明")}
        milestones={getPaidMilestones({ price, cadence }).map((milestone) => ({
          ...milestone,
          when: milestone.date
            ? t(milestone.when, milestone.date.toLocaleDateString("zh-CN"))
            : t(milestone.when, "今天"),
          title: t(
            milestone.title,
            milestone.key === "today" ? "套餐开始生效" : "套餐续订",
          ),
          detail: t(
            milestone.detail,
            milestone.key === "today"
              ? `支付 ${price}，另加适用税费，即可立即获得完整访问权限。`
              : `每${cadence === "year" ? "年" : "月"} ${price}，直到你在设置中取消。`,
          ),
        }))}
      />
      <CheckoutAction
        label={t("Continue to checkout", "前往结账")}
        lockLine={t("Secure checkout by Stripe", "由 Stripe 提供安全结账服务")}
        isProcessing={isProcessing}
        isBlocked={isBlocked}
        onClick={onContinue}
      />
    </TrialPanelShell>
  );
}
