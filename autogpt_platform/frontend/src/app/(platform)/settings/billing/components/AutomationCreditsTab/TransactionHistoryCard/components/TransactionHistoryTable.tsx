"use client";

import { useTranslation } from "@/lib/i18n/LanguageProvider";
import { Button } from "@/components/atoms/Button/Button";
import { useId, type MouseEvent } from "react";
import { Text } from "@/components/atoms/Text/Text";
import type { Transaction } from "../helpers";
import { useReceiptSelection } from "../useReceiptSelection";
import { TransactionRow } from "./TransactionRow";

type Props = {
  transactions: Transaction[];
  hasMore: boolean;
  isLoadingMore: boolean;
  isLoadMoreError: boolean;
  onLoadMore: () => Promise<unknown>;
};

export function TransactionHistoryTable({
  transactions,
  hasMore,
  isLoadingMore,
  isLoadMoreError,
  onLoadMore,
}: Props) {
  const { t } = useTranslation();
  const { selectedID, toggleReceipt, selectRelated } =
    useReceiptSelection(transactions);
  const loadMoreID = useId();
  const endID = useId();

  async function loadOlder(event: MouseEvent<HTMLButtonElement>) {
    const restoreFocus = document.activeElement === event.currentTarget;
    await onLoadMore();
    if (restoreFocus)
      requestAnimationFrame(() => {
        const target =
          document.getElementById(loadMoreID) || document.getElementById(endID);
        target?.focus({ preventScroll: true });
      });
  }
  return (
    <div className="overflow-hidden rounded-large border border-border-base bg-surface shadow-subtle">
      <table
        className="w-full table-fixed border-collapse text-left"
        aria-label={t("Automation credit transactions", "自动化额度交易")}
      >
        <colgroup>
          <col />
          <col className="w-0 sm:w-32" />
          <col className="w-24" />
          <col className="w-12 sm:w-24" />
        </colgroup>
        <thead className="border-b border-border-base bg-surface-muted">
          <tr>
            <th scope="col" className="py-3 pr-2 pl-3 sm:pl-5">
              <Text variant="small-medium" as="span" tone="secondary">
                {t("Activity", "活动")}
              </Text>
            </th>
            <th scope="col" className="p-0 sm:px-2 sm:py-3">
              <Text
                variant="small-medium"
                as="span"
                tone="secondary"
                className="sr-only sm:not-sr-only"
              >
                {t("Last activity", "最近活动")}
              </Text>
            </th>
            <th scope="col" className="px-2 py-3 text-right">
              <Text variant="small-medium" as="span" tone="secondary">
                {t("Amount", "金额")}
              </Text>
            </th>
            <th scope="col">
              <span className="sr-only">{t("Details", "详情")}</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {transactions.map((transaction) => (
            <TransactionRow
              key={transaction.id}
              transaction={transaction}
              open={selectedID === transaction.id}
              onToggle={toggleReceipt}
              loadedTransactions={transactions}
              onSelectRelated={selectRelated}
            />
          ))}
        </tbody>
      </table>
      <div className="flex flex-wrap items-center justify-between gap-3 px-3 py-3 sm:px-5">
        <Text variant="small" tone="secondary">
          {t("Latest charges and credits first", "最新费用和积分变动优先显示")}
        </Text>
        {hasMore ? (
          <Button
            id={loadMoreID}
            variant="secondary"
            size="small"
            className="min-h-11 min-w-0"
            loading={isLoadingMore}
            onClick={(event) => void loadOlder(event)}
          >
            {isLoadMoreError
              ? t("Retry loading more", "重试加载更多")
              : t("Load more", "加载更多")}
          </Button>
        ) : (
          <Text
            variant="small"
            id={endID}
            tabIndex={-1}
            tone="secondary"
            // oxlint-disable-next-line design-system/no-restyle -- a programmatic focus target that shows no outline
            className="focus:outline-none"
          >
            {t("End of history", "已显示全部记录")}
          </Text>
        )}
        {isLoadMoreError && (
          <Text
            variant="small"
            role="alert"
            tone="secondary"
            className="w-full"
          >
            {t(
              "We couldn’t load older transactions. Your loaded history is still available.",
              "无法加载更早的交易。已加载的历史记录仍可查看。",
            )}
          </Text>
        )}
      </div>
      <Text variant="small" className="sr-only" role="status">
        {isLoadingMore
          ? t("Loading older transactions", "正在加载更早的交易")
          : t(
              `${transactions.length} transactions loaded`,
              `已加载 ${transactions.length} 笔交易`,
            )}
      </Text>
    </div>
  );
}
