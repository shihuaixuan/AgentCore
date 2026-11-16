"use client";
import { useTranslation } from "@/lib/i18n/LanguageProvider";
import { Text } from "@/components/atoms/Text/Text";
import { activityName, receiptNote, type Transaction } from "../helpers";
import { ReceiptBreakdown } from "./ReceiptBreakdown";
import { ReceiptEntries } from "./ReceiptEntries";
import { ReceiptMetadata } from "./ReceiptMetadata";
import { ReceiptRelations } from "./ReceiptRelations";

type Props = {
  transaction: Transaction;
  receiptID: string;
  loadedTransactions: Transaction[];
  onSelectRelated: (executionID: string) => void;
};

export function TransactionReceipt({
  transaction,
  receiptID,
  loadedTransactions,
  onSelectRelated,
}: Props) {
  const { t } = useTranslation();
  const hasRelations =
    !!transaction.parent_execution_id ||
    !!transaction.related_executions?.length ||
    !!transaction.related_executions_has_more;
  const heading =
    transaction.activity_type === "agent_run"
      ? t(
          `Charges for this run${hasRelations ? " only" : ""}`,
          hasRelations ? "仅此运行的费用" : "此运行的费用",
        )
      : transaction.activity_type === "copilot_tools"
        ? t("Tool usage in this conversation", "此对话中的工具用量")
        : t("Credit balance change", "积分余额变动");
  const note = receiptNote(transaction, t);
  return (
    <section
      id={receiptID}
      aria-label={t(
        `${activityName(transaction)} credit receipt`,
        `${activityName(transaction, t)} 积分回执`,
      )}
      className="mx-2 mb-3 rounded-medium border border-separator bg-surface-muted p-3 sm:mx-4 sm:p-5"
    >
      <Text variant="body-medium" as="h3">
        {heading}
      </Text>
      <ReceiptBreakdown transaction={transaction} />
      {note && (
        <Text variant="small" tone="secondary" className="mt-3">
          {note}
        </Text>
      )}
      <ReceiptRelations
        transaction={transaction}
        loadedTransactions={loadedTransactions}
        onSelectRelated={onSelectRelated}
      />
      <ReceiptMetadata transaction={transaction} />
      <ReceiptEntries transaction={transaction} />
    </section>
  );
}
