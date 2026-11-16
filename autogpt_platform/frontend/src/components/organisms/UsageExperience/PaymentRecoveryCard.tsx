"use client";

import { useTranslation } from "@/lib/i18n/LanguageProvider";
import { CreditCardIcon } from "@hugeicons/core-free-icons";
import { Icon } from "@/components/atoms/Icon/Icon";
import { Text } from "@/components/atoms/Text/Text";
import type { formatPaymentDue } from "@/services/usageExperience/payment";
import { PaymentDueAction } from "./PaymentDueAction";

interface Props {
  payment: ReturnType<typeof formatPaymentDue>;
  fallback: string;
}

export function PaymentRecoveryCard({ payment, fallback }: Props) {
  const { t } = useTranslation();
  return (
    <section
      aria-label={t("Payment", "付款")}
      data-slot="payment-recovery-card"
      className="w-full rounded-2xl border border-border-base bg-surface p-6 text-left"
    >
      <div
        data-slot="payment-recovery-card-header"
        className="flex items-center gap-2.5"
      >
        <span
          data-slot="payment-recovery-card-icon"
          className="flex size-7 items-center justify-center rounded-lg bg-surface text-foreground-secondary ring-1 ring-border-base"
        >
          <Icon icon={CreditCardIcon} size={17} />
        </span>
        <Text variant="small-medium" tone="secondary">
          {t("Payment", "付款")}
        </Text>
      </div>
      <Text
        variant="h4"
        as="h2"
        className="mt-4 mb-3 leading-8 tracking-display"
      >
        {t("Your payment didn’t go through", "付款未成功")}
      </Text>
      <Text
        variant="small"
        tone="secondary"
        className="max-w-[38rem] leading-6"
      >
        {payment?.description ?? fallback}
      </Text>
      {payment ? (
        <div data-slot="payment-recovery-card-actions" className="mt-5">
          <PaymentDueAction
            url={payment.url}
            label={payment.actionLabel}
            layout="inline"
          />
        </div>
      ) : null}
    </section>
  );
}
