"use client";

import { useTranslation } from "@/lib/i18n/LanguageProvider";
import type { CancelTrialRequest } from "@/app/api/__generated__/models/cancelTrialRequest";
import type { TrialStatusResponse } from "@/app/api/__generated__/models/trialStatusResponse";
import { Badge } from "@/components/atoms/Badge/Badge";
import { Text } from "@/components/atoms/Text/Text";
import { CancelTrialDialog } from "./CancelTrialDialog";
import { formatTrialEnd, formatTrialPrice } from "./helpers";
import { TrialCancelPending } from "./TrialCancelPending";
import { TrialRejection } from "./TrialRejection";

interface Props {
  trial: TrialStatusResponse;
  isCanceling: boolean;
  onCancel: (request: CancelTrialRequest) => void;
  isResuming: boolean;
  onResume: () => void;
}

export function TrialStatus({
  trial,
  isCanceling,
  onCancel,
  isResuming,
  onResume,
}: Props) {
  const { t, locale } = useTranslation();
  if (!trial.offer) return null;
  if (trial.status === "canceled" && trial.rejection_reason)
    return <TrialRejection reason={trial.rejection_reason} />;
  if (trial.active && trial.cancel_at_period_end)
    return (
      <TrialCancelPending
        trial={trial}
        offer={trial.offer}
        isResuming={isResuming}
        onResume={onResume}
      />
    );
  const end = formatTrialEnd(trial.ends_at, locale);
  return (
    <div
      data-slot="trial-status"
      className="flex flex-wrap items-center justify-between gap-x-5 gap-y-3"
    >
      <div
        data-slot="trial-status-details"
        className="min-w-0 basis-full space-y-2 sm:flex-1 sm:basis-auto"
      >
        <div
          data-slot="trial-status-header"
          className="flex flex-wrap items-center gap-2.5"
        >
          <Text variant="large-semibold" as="h2">
            {trial.active
              ? t("Your trial", "你的试用")
              : t("Your trial has ended", "你的试用已结束")}
          </Text>
          <Badge variant="info" size="small">
            {trial.status === "canceled"
              ? t("Canceled", "已取消")
              : trial.active
                ? t("Free trial", "免费试用")
                : t("Ended", "已结束")}
          </Badge>
        </div>
        <Text variant="small-loose" tone="secondary" className="max-w-[560px]">
          {trial.status === "canceled"
            ? t(
                "Cancellation confirmed. Trial access has ended and your trial will not convert to a paid plan.",
                "已确认取消。试用权限已到期，试用不会转为付费套餐。",
              )
            : trial.cancel_at_period_end
              ? t(
                  `Cancellation confirmed. Your trial will not convert to a paid plan. Trial access ends ${end}.`,
                  `已确认取消。试用不会转为付费套餐，试用权限将于 ${end} 到期。`,
                )
              : trial.active
                ? t(
                    `Your trial ends ${end}. Your saved card will then be charged ${formatTrialPrice(trial.offer)}, plus applicable tax.`,
                    `试用将于 ${end} 结束，之后将从已保存的银行卡扣取 ${formatTrialPrice(trial.offer, locale)}，另加适用税费。`,
                  )
                : t(
                    "Paid access requires a successful payment. Review your payment method and plan below.",
                    "付款成功后才能获得付费使用权限。请在下方查看付款方式和套餐。",
                  )}
        </Text>
        {trial.active && (
          <Text variant="small-tight" tone="secondary">
            {t(
              "Cancel before your trial ends to avoid a charge.",
              "请在试用结束前取消，以免产生费用。",
            )}
          </Text>
        )}
      </div>
      {trial.active && !trial.cancel_at_period_end && (
        <CancelTrialDialog
          trial={trial}
          isCanceling={isCanceling}
          onCancel={onCancel}
        />
      )}
    </div>
  );
}
