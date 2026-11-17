"use client";

import { useTranslation } from "@/lib/i18n/LanguageProvider";
import { useId, useState } from "react";
import { ArrowDown01Icon, ArrowUp01Icon } from "@hugeicons/core-free-icons";
import { Button } from "@/components/atoms/Button/Button";
import { Icon } from "@/components/atoms/Icon/Icon";
import { Text } from "@/components/atoms/Text/Text";
import { chargeLabel, formatActivityDate, type Transaction } from "../helpers";
import { TransactionAmount } from "./TransactionAmount";

type Props = { transaction: Transaction };

export function ReceiptEntries({ transaction }: Props) {
  const { t } = useTranslation();
  const [entriesOpen, setEntriesOpen] = useState(false);
  const [referenceOpen, setReferenceOpen] = useState(false);
  const entriesID = useId();
  const referenceID = useId();
  const reference =
    transaction.usage_execution_id ||
    transaction.usage_chat_session_id ||
    transaction.transaction_key;
  return (
    <div className="mt-3">
      <div className="flex flex-wrap items-center justify-between gap-x-4">
        {!!transaction.charges?.length && (
          <Button
            variant="ghost"
            size="inline"
            tone="secondary"
            className="min-h-11"
            onClick={() => setEntriesOpen(!entriesOpen)}
            aria-expanded={entriesOpen}
            aria-controls={entriesOpen ? entriesID : undefined}
            rightIcon={
              <Icon
                icon={entriesOpen ? ArrowUp01Icon : ArrowDown01Icon}
                size={16}
              />
            }
          >
            {t(
              `${entriesOpen ? "Hide" : "Show"} charge entries`,
              entriesOpen ? "隐藏费用条目" : "显示费用条目",
            )}
          </Button>
        )}
        {reference && (
          <Button
            variant="ghost"
            size="inline"
            tone="secondary"
            className="min-h-11"
            onClick={() => setReferenceOpen(!referenceOpen)}
            aria-expanded={referenceOpen}
            aria-controls={referenceOpen ? referenceID : undefined}
          >
            {referenceOpen
              ? t("Hide reference", "隐藏参考信息")
              : t("Reference", "参考信息")}
          </Button>
        )}
      </div>
      {entriesOpen && (
        <div id={entriesID}>
          <ChargeEntries transaction={transaction} />
        </div>
      )}
      {referenceOpen && (
        <div id={referenceID} className="mt-2">
          <Text variant="small" tone="secondary">
            {referenceLabel(transaction, t)}
          </Text>
          <Text variant="small-mono" as="code" className="break-all">
            {reference}
          </Text>
        </div>
      )}
    </div>
  );
}

function referenceLabel(
  transaction: Transaction,
  t: ReturnType<typeof useTranslation>["t"],
) {
  if (transaction.usage_execution_id) return t("Run ID", "运行 ID");
  if (transaction.usage_chat_session_id) return t("Chat ID", "聊天 ID");
  return t("Reference", "参考信息");
}

function ChargeEntries({ transaction }: Props) {
  const { t, locale } = useTranslation();
  const charges = transaction.charges ?? [];
  return (
    <div className="mt-2 border-t border-border-base pt-3">
      <table
        className="w-full text-left"
        aria-label={t("Recorded charge entries", "已记录费用条目")}
      >
        <thead className="sr-only">
          <tr>
            <th scope="col">{t("Date and time", "日期和时间")}</th>
            <th scope="col">{t("Charge", "费用")}</th>
            <th scope="col">{t("Amount", "金额")}</th>
          </tr>
        </thead>
        <tbody>
          {charges.map((charge) => {
            const posted = formatActivityDate(charge.posted_at, t, locale);
            return (
              <tr key={charge.id}>
                <td className="py-2 pr-3 align-top">
                  <Text variant="small" title={posted.full} tone="secondary">
                    {posted.date}
                    <br />
                    {posted.time}
                  </Text>
                </td>
                <td className="py-2 pr-3 align-top">
                  <Text variant="small">
                    {chargeLabel(charge.charge_type, t)}
                  </Text>
                </td>
                <td className="py-2 text-right align-top">
                  <TransactionAmount amount={charge.amount} variant="small" />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {transaction.charges_truncated && (
        <Text variant="small" tone="secondary" className="mt-2">
          {t(
            `Showing ${charges.length} of ${transaction.charges_total_count} charge entries. The total includes every charge and adjustment.`,
            `显示 ${transaction.charges_total_count} 条费用记录中的 ${charges.length} 条。总额包含所有费用和调整。`,
          )}
        </Text>
      )}
    </div>
  );
}
