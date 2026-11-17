"use client";

import { useTranslation } from "@/lib/i18n/LanguageProvider";

import { useReadEveryRender } from "@/hooks/useReadEveryRender";
import { ArrowRight02Icon } from "@hugeicons/core-free-icons";
import { Button } from "@/components/atoms/Button/Button";
import { Icon } from "@/components/atoms/Icon/Icon";
import { Text } from "@/components/atoms/Text/Text";
import { getUsageOfferAction } from "@/services/usageExperience/helpers";
import { formatPaymentDue } from "@/services/usageExperience/payment";
import { usagePresentation } from "@/services/usageExperience/presentation";
import { PaymentDueAction } from "@/components/organisms/UsageExperience/PaymentDueAction";
import { ProviderContinuation } from "@/components/organisms/UsageExperience/ProviderContinuation";
import { UsageMeters } from "@/components/organisms/UsageExperience/UsageMeters";
import {
  budgetOutTitle,
  budgetResetSentence,
} from "@/services/usageExperience/budget";
import type { UsageNoticeContext } from "./useUsageLimitReachedCard";
import { useUsageLimitReachedCard } from "./useUsageLimitReachedCard";

export function UsageLimitReachedCard(props: UsageNoticeContext = {}) {
  const { t, locale } = useTranslation();
  const state = useUsageLimitReachedCard(props);
  // Relative to the clock, so read on every render rather than cached.
  const resetSentence = useReadEveryRender(() =>
    state.wait ? budgetResetSentence(state.wait, undefined, locale) : null,
  );
  if (state.isLoading || (!state.experience.blocked && !state.isError))
    return null;
  const copy = usagePresentation(
    state.experience,
    state.offer.usageMultiplier,
    locale,
  );
  const isOffer =
    state.isBillingEnabled && state.experience.targetTier && !state.isError;
  const due = formatPaymentDue(state.experience.payment, locale);
  const payment = state.isBillingEnabled && !state.isError ? due : null;
  return (
    <section
      role="status"
      aria-label={t("Usage notice", "用量提示")}
      className="mx-auto w-full rounded-2xl border border-border-base bg-surface p-5 shadow-sm"
    >
      <div className="mb-2 flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
        <Text tone="muted" variant="small-tight">
          {state.isRefreshing
            ? t("Checking your allowance", "正在检查可用额度")
            : state.isError
              ? t("Usage temporarily unavailable", "用量信息暂时不可用")
              : copy.eyebrow}
        </Text>
        {!state.isError && (
          <Button
            as="NextLink"
            href="/settings/billing"
            size="inline-xs"
            variant="ghost-muted"
            className="min-w-[5.5rem]"
          >
            {state.experience.inactiveTrialStatus === "payment_failed"
              ? t("Review billing", "查看账单")
              : t("View usage", "查看用量")}
          </Button>
        )}
      </div>
      <Text variant="h4" className="!text-lead !leading-6">
        {state.isRefreshing
          ? t("Checking your usage", "正在检查用量")
          : state.isError
            ? t("We couldn’t check your usage.", "无法查询你的用量。")
            : state.wait
              ? budgetOutTitle(state.wait.window, locale)
              : copy.noticeTitle}
      </Text>
      <Text tone="muted" variant="small-loose" className="mt-2">
        {state.isRefreshing
          ? t("Refreshing your plan and usage…", "正在刷新你的套餐和用量…")
          : state.isError
            ? t(
                "Your work is saved. Try again to check your allowance.",
                "你的工作已保存。请重试以检查可用额度。",
              )
            : state.wait
              ? resetSentence
              : copy.description}
      </Text>
      {state.wait && (
        <UsageMeters
          className="mt-4"
          daily={state.usage?.daily}
          weekly={state.usage?.weekly}
        />
      )}
      {isOffer && (
        <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-2">
          <Button
            size="small"
            onClick={state.upgrade}
            disabled={state.offer.disabled}
            rightIcon={<Icon icon={ArrowRight02Icon} size={14} />}
          >
            {getUsageOfferAction(state.experience, state.offer, locale)}
          </Button>
          {state.experience.freshProUsage && (
            <Text tone="muted" variant="small-tight">
              {t(
                "+ tax. Review before you pay.",
                "另加税费，付款前可核对详情。",
              )}
            </Text>
          )}
        </div>
      )}
      {payment && (
        <div className="mt-4">
          <PaymentDueAction
            url={payment.url}
            label={payment.actionLabel}
            size="small"
            layout="inline"
          />
        </div>
      )}
      {state.alternative && (
        <ProviderContinuation
          name={state.alternative.display_name}
          onContinue={state.continueHere}
          isSwitching={state.isSwitching}
        />
      )}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
        <Text tone="subtle" variant="small-tight">
          {t("You can keep editing your draft.", "你可以继续编辑草稿。")}
        </Text>
        {state.isError ? (
          <Button
            size="small"
            variant="ghost"
            onClick={() => void state.retry()}
            disabled={state.isRefreshing}
          >
            {state.isRefreshing
              ? t("Checking…", "正在检查…")
              : t("Try again", "重试")}
          </Button>
        ) : state.experience.isTopTier && state.isBillingEnabled ? (
          <Button
            as="NextLink"
            href="mailto:contact@agpt.co"
            size="small"
            variant="ghost"
          >
            {copy.supportLabel}
          </Button>
        ) : null}
      </div>
    </section>
  );
}
