"use client";

import { useTranslation } from "@/lib/i18n/LanguageProvider";
import { Text } from "@/components/atoms/Text/Text";
import { activityName, isRunActive, type Transaction } from "../helpers";
import { TransactionAmount } from "./TransactionAmount";

type Props = { transaction: Transaction };

export function ReceiptBreakdown({ transaction }: Props) {
  const { t } = useTranslation();
  const usage =
    transaction.activity_type !== "other" &&
    transaction.transaction_type === "USAGE";
  return (
    <dl className="mt-4 grid grid-cols-[minmax(0,1fr)_auto] gap-x-5 gap-y-2">
      {usage ? (
        <>
          <BreakdownLine
            label={t("Block usage", "模块用量")}
            amount={transaction.usage_charge_amount ?? 0}
          />
          {!!transaction.usage_fee_amount && (
            <BreakdownLine
              label={t("Execution fees", "执行费用")}
              amount={transaction.usage_fee_amount}
            />
          )}
          {!!transaction.usage_adjustment_amount && (
            <BreakdownLine
              label={t("Usage adjustment", "用量调整")}
              amount={transaction.usage_adjustment_amount}
            />
          )}
        </>
      ) : (
        <BreakdownLine
          label={activityName(transaction, t)}
          amount={transaction.amount}
        />
      )}
      <dt className="mt-1 border-t border-border-base pt-3">
        <Text variant="body-medium" as="span">
          {isRunActive(transaction)
            ? t("Net change so far", "截至目前的净变化")
            : t("Net change", "净变化")}
        </Text>
      </dt>
      <dd className="mt-1 border-t border-border-base pt-3 text-right">
        <TransactionAmount amount={transaction.amount} />
      </dd>
    </dl>
  );
}

function BreakdownLine({ label, amount }: { label: string; amount: number }) {
  return (
    <>
      <dt>
        <Text variant="small" as="span" tone="secondary">
          {label}
        </Text>
      </dt>
      <dd className="text-right">
        <TransactionAmount amount={amount} variant="small" />
      </dd>
    </>
  );
}
