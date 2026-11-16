"use client";

import { useTranslation } from "@/lib/i18n/LanguageProvider";
import type { TrialStatusResponse } from "@/app/api/__generated__/models/trialStatusResponse";
import { Button } from "@/components/atoms/Button/Button";
import { Text } from "@/components/atoms/Text/Text";
import { formatTrialPrice, trialPlanLabels } from "./helpers";
import { TrialTitle } from "./TrialTitle/TrialTitle";

interface Props {
  trial: TrialStatusResponse;
  isStarting: boolean;
  isBlocked: boolean;
  onStart: () => void;
}

export function TrialOffer({ trial, isStarting, isBlocked, onStart }: Props) {
  const { t, locale } = useTranslation();
  const offer = trial.offer;
  if (!offer) return null;
  return (
    <div
      data-slot="trial-offer"
      className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between md:gap-8"
    >
      <div
        data-slot="trial-offer-details"
        className="flex min-w-0 flex-col gap-2"
      >
        <div
          data-slot="trial-offer-header"
          className="flex flex-wrap items-center gap-2"
        >
          <TrialTitle>
            {t(
              `Try AutoGPT ${trialPlanLabels[offer.tier]} for ${offer.duration_days} days`,
              `试用 AutoGPT ${trialPlanLabels[offer.tier]} ${offer.duration_days} 天`,
            )}
          </TrialTitle>
          <span
            data-slot="trial-offer-pill"
            className="inline-flex items-center rounded-full bg-accent-surface px-2 py-0.5 text-tiny leading-inherit font-medium text-accent-strong"
          >
            {t("No charge today", "今日不收费")}
          </span>
        </div>
        <Text variant="body" tone="emphasis">
          {t(
            `Card required. No subscription charge today. Then ${formatTrialPrice(offer)}, plus applicable tax, unless you cancel before the trial ends.`,
            `需要提供银行卡，今天不收取订阅费用。除非你在试用结束前取消，否则之后将收取 ${formatTrialPrice(offer, locale)}，另加适用税费。`,
          )}
        </Text>
        <Text variant="small" tone="muted">
          {t(
            "Trial usage is limited. If you cancel, you keep access until the trial ends. You can manage your plan in billing.",
            "试用额度有限。取消后仍可使用至试用结束。你可以在账单设置中管理套餐。",
          )}
        </Text>
      </div>
      <Button
        variant="primary"
        size="large"
        onClick={onStart}
        loading={isStarting}
        disabled={isStarting || isBlocked}
        className="w-full shrink-0 md:w-auto md:min-w-[11rem]"
      >
        {t(
          `Start ${offer.duration_days}-day trial`,
          `开始 ${offer.duration_days} 天试用`,
        )}
      </Button>
    </div>
  );
}
