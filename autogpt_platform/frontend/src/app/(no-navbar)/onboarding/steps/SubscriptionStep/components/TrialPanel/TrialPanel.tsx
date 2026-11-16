"use client";

import { useTranslation } from "@/lib/i18n/LanguageProvider";
import type { TrialOfferResponse } from "@/app/api/__generated__/models/trialOfferResponse";
import { Text } from "@/components/atoms/Text/Text";
import type { ReactNode } from "react";
import { CheckoutAction } from "./CheckoutAction";
import { getTrialMilestones, getTrialMilestoneCopy } from "./helpers";
import { TrialTimeline } from "./TrialTimeline";

// Once the trial status is in, its headline is the step's title.
export const TRIAL_TITLE_ID = "plan-step-title";

interface Props {
  offer: TrialOfferResponse;
  isStarting: boolean;
  isBlocked: boolean;
  error: string | null;
  onStart: () => void;
}

export function TrialPanel({
  offer,
  isStarting,
  isBlocked,
  error,
  onStart,
}: Props) {
  const { t } = useTranslation();
  const milestones = getTrialMilestones(offer);
  return (
    <TrialPanelShell>
      <header className="flex flex-col items-start gap-2">
        <Text variant="eyebrow" as="p">
          {t(
            `${offer.duration_days}-day free trial`,
            `${offer.duration_days} 天免费试用`,
          )}
        </Text>
        <Text variant="h3" as="h1" id={TRIAL_TITLE_ID} className="text-balance">
          {t(
            `Your first ${offer.duration_days} days are on us`,
            `前 ${offer.duration_days} 天免费体验`,
          )}
        </Text>
        <Text variant="large" tone="secondary" className="text-pretty">
          {t(
            "Nothing to pay today, and a reminder before there's ever anything to pay.",
            "今天无需付款，我们会在首次扣款前提醒你。",
          )}
        </Text>
      </header>
      <TrialTimeline
        label={t("How your trial works", "试用说明")}
        milestones={milestones.map((milestone) => {
          const copy = getTrialMilestoneCopy(milestone, offer);
          return {
            ...milestone,
            when: milestone.date
              ? t(milestone.when, milestone.date.toLocaleDateString("zh-CN"))
              : t(milestone.when, "今天"),
            title: t(milestone.title, copy.title),
            detail: t(milestone.detail, copy.detail),
          };
        })}
      />
      <CheckoutAction
        label={t("Start my free trial", "开始免费试用")}
        lockLine={t(
          "Stripe will ask for a card. Nothing is charged today.",
          "Stripe 会要求填写银行卡信息，今天不会扣款。",
        )}
        isProcessing={isStarting}
        isBlocked={isBlocked}
        error={error}
        onClick={onStart}
      />
    </TrialPanelShell>
  );
}

export function TrialPanelShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-col gap-5 bg-surface px-5 pt-6 sm:px-8 lg:px-9 lg:py-8 [@media(max-height:780px)]:gap-4 lg:[@media(max-height:780px)]:py-6">
      {children}
    </div>
  );
}
