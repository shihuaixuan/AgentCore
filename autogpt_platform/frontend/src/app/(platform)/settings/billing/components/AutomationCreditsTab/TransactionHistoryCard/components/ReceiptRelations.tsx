"use client";
import { useTranslation } from "@/lib/i18n/LanguageProvider";
import type { CreditHistoryRelatedExecution } from "@/app/api/__generated__/models/creditHistoryRelatedExecution";
import { Button } from "@/components/atoms/Button/Button";
import { Link } from "@/components/atoms/Link/Link";
import { Text } from "@/components/atoms/Text/Text";
import { libraryHref, type Transaction } from "../helpers";
import { TransactionAmount } from "./TransactionAmount";

type Props = {
  transaction: Transaction;
  loadedTransactions: Transaction[];
  onSelectRelated: (executionID: string) => void;
};

export function ReceiptRelations({
  transaction,
  loadedTransactions,
  onSelectRelated,
}: Props) {
  const { t } = useTranslation();
  const related = transaction.related_executions ?? [];
  if (
    !transaction.parent_execution_id &&
    related.length === 0 &&
    !transaction.related_executions_has_more
  )
    return null;
  return (
    <div className="mt-4 space-y-2 border-t border-border-base pt-3">
      {transaction.parent_execution_id && (
        <Text variant="small" tone="secondary">
          {t("Started by", "由以下运行启动")}
        </Text>
      )}
      {transaction.parent_execution_id && (
        <RelatedExecution
          execution={{
            execution_id: transaction.parent_execution_id,
            agent_name: transaction.parent_agent_name,
            library_agent_id: transaction.parent_library_agent_id,
            execution_available: !!transaction.parent_library_agent_id,
          }}
          loadedTransactions={loadedTransactions}
          receiptAsOf={transaction.receipt_as_of}
          onSelectRelated={onSelectRelated}
        />
      )}
      {(related.length > 0 || transaction.related_executions_has_more) && (
        <Text variant="small" tone="secondary">
          {t("Other workflows used by this run", "此运行使用的其他工作流")}
        </Text>
      )}
      {related.map((execution) => (
        <RelatedExecution
          key={execution.execution_id}
          execution={execution}
          loadedTransactions={loadedTransactions}
          receiptAsOf={transaction.receipt_as_of}
          onSelectRelated={onSelectRelated}
        />
      ))}
      <Text variant="small" tone="secondary">
        {t(
          `Any credit charges for related runs appear separately.${related.length > 0 ? " The task page includes related runs in its total." : ""}`,
          `关联运行的积分费用单独显示。${related.length > 0 ? "任务页面的总额包含关联运行费用。" : ""}`,
        )}
      </Text>
      {transaction.related_executions_has_more && (
        <Text variant="small" tone="secondary">
          {t(
            "More related runs are not shown here.",
            "此处未显示更多关联运行。",
          )}
        </Text>
      )}
    </div>
  );
}

function RelatedExecution({
  execution,
  loadedTransactions,
  receiptAsOf,
  onSelectRelated,
}: {
  execution: CreditHistoryRelatedExecution;
  loadedTransactions: Transaction[];
  receiptAsOf: Transaction["receipt_as_of"];
  onSelectRelated: (executionID: string) => void;
}) {
  const { t } = useTranslation();
  const name =
    execution.agent_name || t("Workflow unavailable", "工作流不可用");
  const loaded = loadedTransactions.find(
    (item) => item.usage_execution_id === execution.execution_id,
  );
  const sameSnapshot =
    receiptAsOf &&
    loaded?.receipt_as_of &&
    new Date(receiptAsOf).getTime() ===
      new Date(loaded.receipt_as_of).getTime();
  const amount = sameSnapshot ? loaded.amount : execution.amount;
  const agentHref = libraryHref(execution.library_agent_id);
  const href =
    agentHref && execution.execution_available
      ? `${agentHref}?activeTab=runs&activeItem=${encodeURIComponent(execution.execution_id)}`
      : null;
  return (
    <div className="flex items-center justify-between gap-4">
      {loaded ? (
        <Button
          variant="ghost"
          size="inline"
          tone="accent"
          className="h-9 min-h-11 text-left whitespace-normal"
          onClick={() => onSelectRelated(execution.execution_id)}
        >
          {name}
        </Button>
      ) : href ? (
        <Link
          href={href}
          // oxlint-disable-next-line design-system/no-restyle -- related-run links are brand-coloured; Link has no brand variant
          className="inline-flex min-h-11 items-center text-accent-strong"
        >
          {name}
        </Link>
      ) : (
        <Text variant="small">{name}</Text>
      )}
      {amount != null && (
        <TransactionAmount amount={amount} variant="small-medium" />
      )}
    </div>
  );
}
