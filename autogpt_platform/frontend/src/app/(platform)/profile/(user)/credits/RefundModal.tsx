import { useState } from "react";
import { useTranslation } from "@/lib/i18n/LanguageProvider";
import { AlertCircleIcon } from "@hugeicons/core-free-icons";
import { Icon } from "@/components/atoms/Icon/Icon";

import { CreditTransaction } from "@/lib/autogpt-server-api";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/molecules/Dialog/components/DialogPrimitives";
import { Button } from "@/components/atoms/Button/Button";
import { Text } from "@/components/atoms/Text/Text";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/atoms/Select/components/SelectPrimitives";
import { Textarea } from "@/components/atoms/Textarea/Textarea";

interface RefundModalProps {
  isOpen: boolean;
  onClose: () => void;
  transactions: CreditTransaction[];
  formatCredits: (credit: number) => string;
  refundCredits: (transaction_key: string, reason: string) => Promise<void>;
}

export const RefundModal = ({
  isOpen,
  onClose,
  transactions,
  formatCredits,
  refundCredits,
}: RefundModalProps) => {
  const { t, locale } = useTranslation();
  const [selectedTransactionId, setSelectedTransactionId] =
    useState<string>("");
  const [refundReason, setRefundReason] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleClose = () => {
    setSelectedTransactionId("");
    setRefundReason("");
    setError(null);
    onClose();
  };

  const handleRefundRequest = () => {
    setError(null);

    const selectedTransaction = transactions.find(
      (t) => t.transaction_key === selectedTransactionId,
    );

    if (!selectedTransaction) {
      setError(
        t("Please select a transaction to refund", "请选择要退款的交易"),
      );
      return;
    }

    if (refundReason.trim().length < 20) {
      setError(
        t(
          "Please provide a clear reason for the refund",
          "请提供清晰的退款原因",
        ),
      );
      return;
    }

    refundCredits(selectedTransactionId, refundReason).finally(() =>
      handleClose(),
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{t("Request Refund", "申请退款")}</DialogTitle>
        </DialogHeader>
        <div className="py-4">
          <div className="space-y-4">
            {error && (
              <div className="flex items-center gap-2 rounded-md border border-error bg-error/10 p-3 text-error">
                <Icon aria-hidden icon={AlertCircleIcon} className="h-4 w-4" />
                <Text variant="body-tight" tone="inherit">
                  {error}
                </Text>
              </div>
            )}

            {transactions.length === 0 ? (
              <Text variant="body-tight" tone="muted">
                {t(
                  "No eligible transactions found for refund.",
                  "未找到符合退款条件的交易。",
                )}
              </Text>
            ) : (
              <div className="space-y-2">
                <Text variant="body-medium-tight" as="label" tone="inherit">
                  {t("Select Transaction", "选择交易")}
                </Text>
                <Select
                  value={selectedTransactionId}
                  onValueChange={setSelectedTransactionId}
                >
                  <SelectTrigger>
                    <SelectValue
                      placeholder={t("Select a transaction", "选择一笔交易")}
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {transactions.map((transaction) => (
                      <SelectItem
                        key={transaction.transaction_key}
                        value={transaction.transaction_key}
                      >
                        {new Date(transaction.transaction_time).toLocaleString(
                          locale,
                          {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                            hour: "numeric",
                            minute: "numeric",
                          },
                        )}{" "}
                        - {formatCredits(transaction.amount)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2">
              <label htmlFor="refundReason">
                <Text variant="body-medium-tight" as="span" tone="inherit">
                  {t("Reason for Refund", "退款原因")}
                </Text>
              </label>
              <Textarea
                id="refundReason"
                placeholder={t(
                  "Please explain why you're requesting a refund...",
                  "请说明申请退款的原因…",
                )}
                value={refundReason}
                onChange={(e) => setRefundReason(e.target.value)}
                className="min-h-[100px]"
              />
            </div>
          </div>
        </div>
        <div className="flex justify-end space-x-4">
          <Button
            variant="compact-outline"
            size="compact"
            onClick={handleClose}
          >
            {t("Cancel", "取消")}
          </Button>
          <Button
            variant="compact-primary"
            size="compact"
            onClick={handleRefundRequest}
          >
            {t("Request Refund", "申请退款")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
