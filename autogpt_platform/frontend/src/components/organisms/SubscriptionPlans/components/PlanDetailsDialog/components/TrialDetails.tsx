"use client";

import { useTranslation } from "@/lib/i18n/LanguageProvider";
import type { TrialOfferResponse } from "@/app/api/__generated__/models/trialOfferResponse";
import { Text } from "@/components/atoms/Text/Text";
import { formatTrialPrice } from "@/components/organisms/TrialCard/helpers";
import { formatPlanAmount } from "../../../helpers";

interface Props {
  offer: TrialOfferResponse;
}

export function TrialDetails({ offer }: Props) {
  const { t, locale } = useTranslation();
  return (
    <div data-slot="trial-details" className="space-y-5">
      <Text variant="body" tone="secondary">
        {t(
          `${offer.duration_days} days to put AutoGPT to work.`,
          `让 AutoGPT 为你工作 ${offer.duration_days} 天。`,
        )}
      </Text>
      <dl
        data-slot="trial-details-list"
        className="divide-y divide-border-base border-y border-border-base"
      >
        <div
          data-slot="trial-details-row"
          className="flex justify-between gap-4 py-4"
        >
          <Text as="dt" variant="body">
            {t("Today", "今天")}
          </Text>
          <Text as="dd" variant="lead-medium">
            {formatPlanAmount(0, offer.currency)}
          </Text>
        </div>
        <div
          data-slot="trial-details-row"
          className="flex justify-between gap-4 py-4"
        >
          <Text as="dt" variant="body">
            {t(
              `After ${offer.duration_days} days`,
              `${offer.duration_days} 天后`,
            )}
          </Text>
          <Text as="dd" variant="lead-medium">
            {formatTrialPrice(offer, locale)}
          </Text>
        </div>
      </dl>
      <Text variant="body" tone="secondary">
        {t(
          "Card required. No subscription charge today. Your paid subscription starts automatically after the trial, plus applicable tax, unless you cancel before it ends.",
          "需要提供银行卡，今天不收取订阅费用。除非你在试用结束前取消，否则试用结束后将自动开始付费订阅，并加收适用税费。",
        )}
      </Text>
      <Text variant="body" tone="secondary">
        {t(
          "Trial usage is limited. If you cancel, you keep access until the trial ends. You can manage or cancel your plan in billing.",
          "试用额度有限。取消后仍可使用至试用结束。你可以在账单设置中管理或取消套餐。",
        )}
      </Text>
    </div>
  );
}
