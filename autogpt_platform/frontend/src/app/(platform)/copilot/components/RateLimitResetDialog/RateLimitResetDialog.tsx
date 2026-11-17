"use client";

import { useReadEveryRender } from "@/hooks/useReadEveryRender";
import { useTranslation } from "@/lib/i18n/LanguageProvider";
import type { SubscriptionTier } from "@/app/api/__generated__/models/subscriptionTier";
import { Button } from "@/components/atoms/Button/Button";
import { Text } from "@/components/atoms/Text/Text";
import { Dialog } from "@/components/molecules/Dialog/Dialog";
import { PaymentDueAction } from "@/components/organisms/UsageExperience/PaymentDueAction";
import { PlanOffer } from "@/components/organisms/UsageExperience/PlanOffer";
import { ProviderContinuation } from "@/components/organisms/UsageExperience/ProviderContinuation";
import { UsageMeter } from "@/components/organisms/UsageExperience/UsageMeter";
import {
  getUsageExperience,
  getUsageOfferAction,
  type UsageExperience,
} from "@/services/usageExperience/helpers";
import { formatPaymentDue } from "@/services/usageExperience/payment";
import { usagePresentation } from "@/services/usageExperience/presentation";
import {
  budgetOutTitle,
  budgetResetSentence,
  type ResetWait,
} from "@/services/usageExperience/budget";
import { useRouter } from "next/navigation";
import type { ComponentProps } from "react";
import { ResetWaitBox } from "./components/ResetWaitBox";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  resetsAt?: string | Date | null;
  tier?: SubscriptionTier | null;
  experience?: UsageExperience;
  offer?: Omit<ComponentProps<typeof PlanOffer>, "onUpgrade">;
  onUpgrade?: () => void;
  unavailable?: boolean;
  checking?: boolean;
  failureWindow?: string;
  onRetry?: () => void;
  isBillingEnabled?: boolean;
  alternative?: { display_name: string } | null;
  onContinue?: () => void;
  isSwitching?: boolean;
  /** The reset a blocked chat can wait for, when it has one. */
  wait?: ResetWait | null;
  meters?: ComponentProps<typeof ResetWaitBox>["meters"];
  onSendAtReset?: () => void;
  isSchedulingAtReset?: boolean;
}

export function RateLimitResetDialog({
  isOpen,
  onClose,
  resetsAt,
  tier,
  experience,
  offer,
  onUpgrade,
  unavailable = false,
  checking = false,
  failureWindow,
  onRetry,
  isBillingEnabled = true,
  alternative,
  onContinue,
  isSwitching,
  wait = null,
  meters,
  onSendAtReset,
  isSchedulingAtReset,
}: Props) {
  const { t, locale } = useTranslation();
  const router = useRouter();
  const model =
    experience ??
    getUsageExperience({
      tier: tier ?? "BASIC",
      daily: {
        percent_used: 100,
        resets_at: resetsAt ? new Date(resetsAt).toISOString() : "",
      },
    });
  const copy = usagePresentation(model, offer?.usageMultiplier, locale);
  // A top-tier plan has no upgrade to lead with, so waiting for the reset
  // leads instead.
  const waitTitle =
    wait && model.isTopTier ? budgetOutTitle(wait.window, locale) : null;
  // Relative to the clock, so read on every render rather than cached.
  const resetSentence = useReadEveryRender(() =>
    wait ? budgetResetSentence(wait, undefined, locale) : null,
  );
  const payment = formatPaymentDue(model.payment, locale);
  const fallbackTitle =
    failureWindow === "trial"
      ? t("You’ve used your trial allowance", "你已用完试用额度")
      : failureWindow === "weekly"
        ? t("You’ve hit this week’s limit", "你已达到本周用量上限")
        : failureWindow === "daily"
          ? t("You’ve hit today’s limit", "你已达到今日用量上限")
          : t("We couldn’t check your usage.", "无法查询你的用量。");
  function upgrade() {
    if (onUpgrade) onUpgrade();
    else {
      onClose();
      router.push("/settings/billing");
    }
  }
  return (
    <Dialog
      variant="compact"
      title={
        <div className="pr-6">
          <Text tone="muted" variant="small-tight" className="mb-2">
            {checking
              ? t("Checking your allowance", "正在检查可用额度")
              : unavailable
                ? t("Usage temporarily unavailable", "用量信息暂时不可用")
                : copy.eyebrow}
          </Text>
          <Text as="span" variant="h3" className="!leading-8">
            {checking
              ? t("One moment. Your work is saved.", "请稍候。你的工作已保存。")
              : unavailable
                ? fallbackTitle
                : (waitTitle ?? copy.title)}
          </Text>
        </div>
      }
      styling={{ maxWidth: "35rem", minWidth: "auto" }}
      controlled={{
        isOpen,
        set: (open) => {
          if (!open) onClose();
        },
      }}
    >
      <Dialog.Content>
        {checking ? (
          <Text tone="muted" variant="body-tight" role="status">
            {t("Refreshing your plan and usage…", "正在刷新你的套餐和用量…")}
          </Text>
        ) : unavailable ? (
          <div className="space-y-5">
            <Text tone="muted" variant="body" className="!text-body !leading-6">
              {t(
                "Your work is saved. Try again to check your allowance before continuing.",
                "你的工作已保存。请重试以检查可用额度，然后再继续。",
              )}
            </Text>
            <Button onClick={onRetry}>{t("Try again", "重试")}</Button>
          </div>
        ) : (
          <>
            <Text
              tone="muted"
              variant="body"
              className="mb-5 !text-body !leading-6"
            >
              {waitTitle && wait ? resetSentence : copy.description}
            </Text>
            {copy.trialSpent && (
              <div className="mb-5">
                <UsageMeter
                  label={t("Trial allowance", "试用额度")}
                  percent={model.trialPercent ?? 100}
                  detail={t(
                    "One allowance for your trial. It doesn’t refresh.",
                    "试用期间共用一份额度，不会重置。",
                  )}
                />
              </div>
            )}
            {wait && (
              <ResetWaitBox
                meters={meters}
                onSendAtReset={onSendAtReset}
                isScheduling={isSchedulingAtReset}
              />
            )}
            {isBillingEnabled && model.targetTier && (
              <PlanOffer
                tier={model.targetTier}
                {...offer}
                actionLabel={getUsageOfferAction(model, offer ?? {}, locale)}
                onUpgrade={upgrade}
              />
            )}
            {isBillingEnabled &&
              model.inactiveTrialStatus === "payment_failed" &&
              (payment ? (
                <PaymentDueAction
                  url={payment.url}
                  label={payment.actionLabel}
                />
              ) : (
                <Button className="w-full" onClick={upgrade}>
                  {t("Review billing details", "查看账单详情")}
                </Button>
              ))}
            {isBillingEnabled && model.isTopTier && (
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border-base p-4">
                <div>
                  <Text variant="small-medium">
                    {t("Need more capacity?", "需要更多额度？")}
                  </Text>
                  <Text tone="muted" variant="small" className="mt-1">
                    {t(
                      "We’ll help find the right fit.",
                      "我们会帮你找到合适的方案。",
                    )}
                  </Text>
                </div>
                <Button
                  as="NextLink"
                  href="mailto:contact@agpt.co"
                  variant="secondary"
                  size="small"
                >
                  {copy.supportLabel}
                </Button>
              </div>
            )}
          </>
        )}
        {alternative && onContinue && (
          <ProviderContinuation
            name={alternative.display_name}
            onContinue={onContinue}
            isSwitching={isSwitching}
          />
        )}
        <Button variant="ghost" className="mt-3 w-full" onClick={onClose}>
          {checking || unavailable
            ? t("Back to my work", "返回工作")
            : copy.secondary}
        </Button>
      </Dialog.Content>
    </Dialog>
  );
}
