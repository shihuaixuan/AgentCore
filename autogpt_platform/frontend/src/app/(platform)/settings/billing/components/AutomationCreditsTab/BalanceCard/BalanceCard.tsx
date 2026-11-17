"use client";

import { useTranslation } from "@/lib/i18n/LanguageProvider";
import { motion, useReducedMotion } from "framer-motion";

import { Button } from "@/components/atoms/Button/Button";
import { Input } from "@/components/atoms/Input/Input";
import { Skeleton } from "@/components/atoms/Skeleton/Skeleton";
import { Text } from "@/components/atoms/Text/Text";
import { Dialog } from "@/components/molecules/Dialog/Dialog";
import { ErrorCard } from "@/components/molecules/ErrorCard/ErrorCard";
import { InformationTooltip } from "@/components/molecules/InformationTooltip/InformationTooltip";

import { formatCents, getSectionMotionProps } from "../../../helpers";
import { useBalanceCard } from "./useBalanceCard";

interface Props {
  index?: number;
}

const BALANCE_EXPLAINER =
  "Automation Credits are platform credits used for automation executions. They are not cash, cannot be withdrawn, and cannot be exchanged for subscription fees.";

export function BalanceCard({ index = 0 }: Props) {
  const { t } = useTranslation();
  const reduceMotion = useReducedMotion();
  const {
    balanceCents,
    isLoading,
    isError,
    refetch,
    open,
    setOpen,
    amount,
    setAmount,
    isValid,
    isAdding,
    isRedirecting,
    handleSubmit,
  } = useBalanceCard();

  const sectionMotion = getSectionMotionProps(index, Boolean(reduceMotion));

  if (isLoading) {
    return (
      <motion.div {...sectionMotion}>
        <Skeleton className="h-[120px] rounded-2xl" />
      </motion.div>
    );
  }

  if (isError || balanceCents === null) {
    return (
      <ErrorCard
        context="balance"
        hint="We couldn't load your credit balance."
        onRetry={() => void refetch()}
      />
    );
  }

  return (
    <motion.section {...sectionMotion} className="flex w-full flex-col gap-2">
      <div className="flex items-center gap-1 px-4">
        <Text variant="body-medium" as="span">
          {t("Automation credits", "自动化额度")}
        </Text>
        <InformationTooltip description={BALANCE_EXPLAINER} iconSize={22} />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4 rounded-large border border-border-base bg-surface p-5 shadow-message-table">
        <Text variant="h2" as="span">
          {formatCents(balanceCents)}
        </Text>
        <Dialog
          title={t("Add credits", "充值额度")}
          styling={{ maxWidth: "420px" }}
          controlled={{ isOpen: open, set: setOpen }}
        >
          <Dialog.Trigger>
            <Button variant="primary" size="small">
              {t("Add credits", "充值额度")}
            </Button>
          </Dialog.Trigger>
          <Dialog.Content>
            <div className="flex flex-col gap-3">
              <Text variant="small" as="span" tone="muted">
                We&apos;ll redirect you to Stripe to complete your purchase.
              </Text>
              <Input
                id="addcredits-amount"
                label={t(
                  "Amount (USD, whole dollars only, minimum $5)",
                  "金额（美元，仅限整数，最低 5 美元）",
                )}
                type="amount"
                amountPrefix="$"
                decimalCount={0}
                placeholder={t("Amount", "金额")}
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
                wrapperClassName="!mb-0"
              />
            </div>
            <Dialog.Footer>
              <Button
                type="button"
                variant="ghost"
                size="small"
                onClick={() => setOpen(false)}
              >
                {t("Cancel", "取消")}
              </Button>
              <Button
                type="button"
                variant="primary"
                size="small"
                disabled={!isValid || isAdding || isRedirecting}
                loading={isAdding}
                onClick={handleSubmit}
              >
                {t("Continue to checkout", "继续结账")}
              </Button>
            </Dialog.Footer>
          </Dialog.Content>
        </Dialog>
      </div>
    </motion.section>
  );
}
