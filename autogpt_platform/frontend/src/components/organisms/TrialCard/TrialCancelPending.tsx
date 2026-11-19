"use client";

import { useTranslation } from "@/lib/i18n/LanguageProvider";
import type { TrialOfferResponse } from "@/app/api/__generated__/models/trialOfferResponse";
import type { TrialStatusResponse } from "@/app/api/__generated__/models/trialStatusResponse";
import { Button } from "@/components/atoms/Button/Button";
import { Text } from "@/components/atoms/Text/Text";
import {
  formatPlanPrice,
  formatTrialEnd,
  formatTrialEndDate,
  trialPlanLabels,
} from "./helpers";
import { TrialTitle } from "./TrialTitle/TrialTitle";

interface Props {
  trial: TrialStatusResponse;
  offer: TrialOfferResponse;
  isResuming: boolean;
  onResume: () => void;
}

export function TrialCancelPending({
  trial,
  offer,
  isResuming,
  onResume,
}: Props) {
  const { t, locale } = useTranslation();
  return (
    <div data-slot="trial-cancel-pending" className="flex flex-col gap-3">
      <div
        data-slot="trial-cancel-pending-header"
        className="flex flex-wrap items-center gap-2"
      >
        <TrialTitle>{t("Your trial", "你的试用")}</TrialTitle>
        <span
          data-slot="trial-cancel-pending-status"
          className="inline-flex items-center gap-1.5 rounded-full bg-surface-hover px-2 py-0.5 text-caption text-foreground-body"
        >
          <span
            aria-hidden
            data-slot="trial-cancel-pending-status-dot"
            className="size-1.5 rounded-full bg-foreground-subtle"
          />
          {t("Cancellation pending", "正在取消")}
        </span>
      </div>
      <Text variant="body" tone="emphasis">
        {t(
          `Cancellation confirmed. Your trial will not convert to a paid plan and your card won't be charged. Trial access ends ${formatTrialEnd(trial.ends_at)}.`,
          `已确认取消。试用不会转为付费套餐，也不会向银行卡扣款。试用权限将于 ${formatTrialEnd(trial.ends_at, locale)} 到期。`,
        )}
      </Text>
      {trial.ends_at ? (
        <Text variant="small" tone="muted">
          {t(
            `Resume to keep the trial and start ${trialPlanLabels[offer.tier]} on ${formatTrialEndDate(trial.ends_at)} at ${formatPlanPrice(offer)}, plus applicable tax.`,
            `恢复后可继续试用，并于 ${formatTrialEndDate(trial.ends_at, locale)} 开始使用 ${trialPlanLabels[offer.tier]}，费用为 ${formatPlanPrice(offer, locale)}，另加适用税费。`,
          )}
        </Text>
      ) : null}
      <div data-slot="trial-cancel-pending-actions" className="mt-1">
        <Button
          variant="secondary"
          size="small"
          loading={isResuming}
          disabled={isResuming}
          onClick={onResume}
        >
          {t("Resume trial", "恢复试用")}
        </Button>
      </div>
    </div>
  );
}
