"use client";

import { useTranslation } from "@/lib/i18n/LanguageProvider";
import { motion, useReducedMotion } from "framer-motion";
import { useId } from "react";
import { Button } from "@/components/atoms/Button/Button";
import { Skeleton } from "@/components/atoms/Skeleton/Skeleton";
import { Text } from "@/components/atoms/Text/Text";
import { ErrorCard } from "@/components/molecules/ErrorCard/ErrorCard";
import { getSectionMotionProps } from "../../../helpers";
import { TransactionHistoryTable } from "./components/TransactionHistoryTable";
import { useTransactionHistoryCard } from "./useTransactionHistoryCard";

type Props = { index?: number };

export function TransactionHistoryCard({ index = 0 }: Props) {
  const { t } = useTranslation();
  const reduceMotion = useReducedMotion();
  const history = useTransactionHistoryCard();
  const headingID = useId();

  async function retryHistory() {
    await history.refetch();
    document.getElementById(headingID)?.focus({ preventScroll: true });
  }
  return (
    <motion.section
      {...getSectionMotionProps(index, Boolean(reduceMotion))}
      className="flex w-full flex-col gap-3"
      aria-label={t("Transaction history", "交易记录")}
    >
      <div className="flex flex-wrap items-end justify-between gap-2 px-4">
        <div>
          <Text
            variant="body-medium"
            as="h2"
            id={headingID}
            tabIndex={-1}
            // oxlint-disable-next-line design-system/no-restyle -- a programmatic focus target that shows no outline
            className="focus:outline-none"
          >
            {t("Transaction history", "交易记录")}
          </Text>
          <Text variant="small" tone="secondary" className="mt-1">
            {t(
              "Changes to your automation credit balance.",
              "自动化积分余额的变动记录。",
            )}
          </Text>
        </div>
        <Text variant="small" tone="secondary">
          {t("USD · Your local time", "USD · 你的当地时间")}
        </Text>
      </div>
      {history.isLoading ? (
        <HistorySkeleton />
      ) : history.isError ? (
        <ErrorCard
          context={t("transaction history", "交易记录")}
          hint={t(
            "We couldn’t load your transactions. Please try again.",
            "无法加载交易记录，请重试。",
          )}
          onRetry={() => void retryHistory()}
        />
      ) : history.transactions.length === 0 ? (
        <EmptyHistory />
      ) : (
        <TransactionHistoryTable
          transactions={history.transactions}
          hasMore={history.hasMore}
          isLoadingMore={history.isLoadingMore}
          isLoadMoreError={history.isLoadMoreError}
          onLoadMore={() => history.loadMore()}
        />
      )}
      {history.isRefreshError && (
        <div
          className="flex flex-wrap items-center justify-between gap-2 px-4"
          role="alert"
        >
          <Text variant="small" tone="secondary">
            {t(
              "History couldn’t be refreshed. Showing previously loaded activity.",
              "无法刷新记录，正在显示之前加载的活动。",
            )}
          </Text>
          <Button
            variant="ghost"
            size="small"
            onClick={() => void retryHistory()}
          >
            {t("Try again", "重试")}
          </Button>
        </div>
      )}
      <Text variant="small" tone="secondary" className="mx-4">
        {t(
          "Each workflow run combines its recorded charges and adjustments. Only runs with credit activity appear here.",
          "每次工作流运行会汇总已记录的费用和调整。仅显示有积分变动的运行。",
        )}
      </Text>
    </motion.section>
  );
}

function HistorySkeleton() {
  const { t } = useTranslation();
  return (
    <div
      role="status"
      aria-label={t("Loading transaction history", "正在加载交易记录")}
      className="rounded-large border border-border-base bg-surface p-5"
    >
      <div className="space-y-6">
        {Array.from({ length: 5 }, (_, index) => (
          <div key={index} className="flex items-center justify-between gap-6">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-5 w-16" />
          </div>
        ))}
      </div>
    </div>
  );
}

function EmptyHistory() {
  const { t } = useTranslation();
  return (
    <div className="rounded-large border border-border-base bg-surface px-5 py-10 text-center">
      <Text variant="body-medium">
        {t("No transactions yet.", "暂无交易记录。")}
      </Text>
      <Text variant="small" tone="secondary" className="mt-2">
        {t(
          "Credit purchases and paid activity will appear here.",
          "购买积分和付费活动将显示在这里。",
        )}
      </Text>
    </div>
  );
}
