"use client";

import { useTranslation } from "@/lib/i18n/LanguageProvider";
import { Dialog } from "@/components/molecules/Dialog/Dialog";
import { Text } from "@/components/atoms/Text/Text";
import { Button } from "@/components/atoms/Button/Button";
import type { useActivationController } from "@/services/pro-activation/useActivationController";
import { formatAmount } from "@/services/pro-activation/helpers";
import { ActivationTerms } from "./ActivationTerms";
import { ActivationStatus } from "./ActivationStatus";
import { ActivationPaymentMethod } from "./ActivationPaymentMethod";
import { billingCadence } from "./display-helpers";
import { useQuoteExpiry } from "@/services/pro-activation/useQuoteExpiry";

interface Props {
  activation: ReturnType<typeof useActivationController>;
}

export function ProActivationDialog({ activation }: Props) {
  const { t, locale } = useTranslation();
  const {
    attempt,
    isOpen,
    setOpen,
    isBusy,
    isReady,
    hasFreshUsage,
    readyPlan,
    error,
    needsNewTerms,
    retryConsent,
    confirm,
    check,
    start,
  } = activation;
  const review = attempt?.status === "confirmation_required" && attempt.terms;
  const expiry = useQuoteExpiry(review ? review.expires_at : undefined);
  const refreshTerms = needsNewTerms || (expiry.expired && !retryConsent);
  const plan = (attempt?.terms?.plan ?? readyPlan) === "MAX" ? "Max" : "Pro";
  const title = isReady
    ? t(`${plan} is active`, `${plan} 已启用`)
    : review
      ? t(`Start ${plan} today`, `今天启用 ${plan}`)
      : attempt?.status === "not_applicable"
        ? t("Your plan has changed", "你的套餐已变更")
        : attempt?.status === "failed"
          ? t("Your payment wasn’t completed.", "你的付款未完成。")
          : attempt?.status === "action_required" ||
              attempt?.status === "payment_required"
            ? t(
                `One more step to start ${plan}.`,
                `再完成一步即可启用 ${plan}。`,
              )
            : t(`Getting ${plan} ready.`, `正在准备 ${plan}。`);
  return (
    <Dialog
      variant="compact"
      controlled={{ isOpen, set: setOpen }}
      styling={{ maxWidth: "560px" }}
      title={
        <div
          data-slot="pro-activation-dialog-heading"
          className="space-y-2 pr-7"
        >
          <Text variant="small-medium" tone="muted">
            {review ? t("Payment review", "核对付款") : `AutoGPT ${plan}`}
          </Text>
          <span
            data-slot="pro-activation-dialog-title"
            className="block text-heading leading-tight font-semibold tracking-heading text-foreground-strong"
          >
            {title}
          </span>
        </div>
      }
    >
      <Dialog.Content>
        <div data-slot="pro-activation-dialog-body" className="space-y-5">
          {error && (
            <div
              role="alert"
              data-slot="pro-activation-dialog-error"
              className="rounded-large border border-warning-border bg-warning-surface p-4 text-body text-foreground-body"
            >
              {error}
            </div>
          )}
          {review ? (
            <>
              <ActivationTerms terms={review} />
              <ActivationPaymentMethod />
              {expiry.expiringSoon && !retryConsent && (
                <Text variant="small" tone="warning">
                  {t(
                    "This price is held for a few more minutes.",
                    "此价格还将保留几分钟。",
                  )}
                </Text>
              )}
              {expiry.expired && !retryConsent && (
                <Text variant="small" tone="warning" role="status">
                  {t(
                    "This quote has expired. Review the current terms before paying.",
                    "此报价已过期，请在付款前查看当前条款。",
                  )}
                </Text>
              )}
              <Button
                variant="primary"
                className="w-full"
                disabled={isBusy || refreshTerms}
                loading={isBusy}
                onClick={confirm}
              >
                {retryConsent
                  ? t("Retry same confirmation", "重试此次确认")
                  : t(
                      `Pay ${formatAmount(review.amount_due, review.currency)} and start ${plan}`,
                      `支付 ${formatAmount(review.amount_due, review.currency)} 并启用 ${plan}`,
                    )}
              </Button>
              <Text variant="small" tone="muted" className="text-center">
                {t(
                  `Renews ${billingCadence(review, locale)} until you cancel. Cancel anytime in Billing.`,
                  `按${billingCadence(review, locale)}的周期续订，直至取消。你可以随时在账单设置中取消。`,
                )}
              </Text>
              {error && !needsNewTerms && retryConsent && (
                <Button
                  variant="secondary"
                  className="w-full"
                  onClick={() => check()}
                  disabled={isBusy}
                >
                  {t("Check existing payment", "检查现有付款")}
                </Button>
              )}
              {refreshTerms && (
                <Button
                  variant="secondary"
                  className="w-full"
                  onClick={() => start(attempt.return_to)}
                  disabled={isBusy}
                >
                  {t("Review current terms", "查看当前条款")}
                </Button>
              )}
              <Button
                variant="link"
                tone="secondary"
                className="w-full"
                onClick={() => setOpen(false)}
              >
                {t("Not now", "暂时不用")}
              </Button>
            </>
          ) : attempt ? (
            <ActivationStatus
              attempt={attempt}
              isBusy={isBusy}
              isReady={isReady}
              hasFreshUsage={hasFreshUsage}
              plan={plan}
              check={check}
              close={() => setOpen(false)}
            />
          ) : (
            <Button
              variant="secondary"
              className="w-full"
              loading={isBusy}
              onClick={() => start()}
            >
              {isBusy
                ? t("Loading your upgrade details…", "正在加载升级详情…")
                : t("Try again", "重试")}
            </Button>
          )}
        </div>
      </Dialog.Content>
    </Dialog>
  );
}
