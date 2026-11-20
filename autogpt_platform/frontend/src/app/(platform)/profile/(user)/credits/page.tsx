"use client";
import { AUTOPILOT_NAME } from "@/lib/branding";
import { useEffect, useState } from "react";
import { useTranslation } from "@/lib/i18n/LanguageProvider";
import { Button } from "@/components/atoms/Button/Button";
import { Text } from "@/components/atoms/Text/Text";
import { useCheckoutRedirect } from "@/hooks/useCheckoutRedirect";
import { useStableCallback } from "@/hooks/useStableCallback";
import useCredits from "@/hooks/useCredits";
import { useBackendAPI } from "@/lib/autogpt-server-api/context";
import { useSearchParams, useRouter } from "next/navigation";
import {
  useToast,
  useToastOnFail,
} from "@/components/molecules/Toast/use-toast";

import { RefundModal } from "./RefundModal";
import { SubscriptionTierSection } from "./components/SubscriptionTierSection/SubscriptionTierSection";
import { CreditTransaction } from "@/lib/autogpt-server-api";
import { StorageBar } from "@/app/(platform)/copilot/components/UsageLimits/StorageBar";
import { UsageBar } from "@/app/(platform)/copilot/components/UsageLimits/UsageBar";
import type { CoPilotUsagePublic } from "@/app/api/__generated__/models/coPilotUsagePublic";
import { useGetV2GetCopilotUsage } from "@/app/api/__generated__/endpoints/chat/chat";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/molecules/Table/components/TablePrimitives";

function CoPilotUsageSection() {
  const { t } = useTranslation();
  const router = useRouter();
  const { data: usage, isSuccess } = useGetV2GetCopilotUsage({
    query: {
      select: (res) => res.data as CoPilotUsagePublic,
      refetchInterval: 30000,
      staleTime: 10000,
    },
  });

  if (!isSuccess || !usage) return null;
  if (!usage.daily && !usage.weekly) return null;

  return (
    <div className="my-6 space-y-4">
      <Text variant="lead-medium" as="h3" tone="inherit">
        {t("Expert Usage & Storage", "专家用量与存储")}
      </Text>
      <div className="flex flex-col gap-3 rounded-lg border border-border-base p-4">
        {usage.daily && (
          <UsageBar
            label={t("Today", "今天")}
            percentUsed={usage.daily.percent_used}
            resetsAt={usage.daily.resets_at}
          />
        )}
        {usage.weekly && (
          <UsageBar
            label={t("This week", "本周")}
            percentUsed={usage.weekly.percent_used}
            resetsAt={usage.weekly.resets_at}
          />
        )}
        <StorageBar />
      </div>
      <Button
        variant="compact-primary"
        size="compact"
        className="w-full"
        onClick={() => router.push("/copilot")}
      >
        {t(`Open ${AUTOPILOT_NAME}`, `打开 ${AUTOPILOT_NAME}`)}
      </Button>
    </div>
  );
}

export default function CreditsPage() {
  const { t, locale } = useTranslation();
  const api = useBackendAPI();
  const {
    requestTopUp,
    autoTopUpConfig,
    updateAutoTopUpConfig,
    transactionHistory,
    fetchTransactionHistory,
    formatCredits,
    refundTopUp,
    refundRequests,
  } = useCredits({
    fetchInitialAutoTopUpConfig: true,
    fetchInitialRefundRequests: true,
    fetchInitialTransactionHistory: true,
  });
  const router = useRouter();
  const searchParams = useSearchParams();
  const topupStatus = searchParams.get("topup") as "success" | "cancel" | null;
  const { toast } = useToast();
  const toastOnFail = useToastOnFail();
  const notifyCheckoutFailure = useStableCallback((error: unknown) => {
    toastOnFail(t("fulfill checkout", "完成结账"))(error);
  });
  const checkoutRedirect = useCheckoutRedirect();
  const [isRequestingTopUp, setIsRequestingTopUp] = useState(false);

  const [isRefundModalOpen, setIsRefundModalOpen] = useState(false);
  const [topUpTransactions, setTopUpTransactions] = useState<
    CreditTransaction[]
  >([]);
  const openRefundModal = () => {
    api.getTransactionHistory(null, 20, "TOP_UP").then((history) => {
      setTopUpTransactions(history.transactions);
      setIsRefundModalOpen(true);
    });
  };
  const refundCredits = (transaction_key: string, reason: string) =>
    refundTopUp(transaction_key, reason)
      .then((amount) => {
        if (amount > 0) {
          toast({
            title: t("Refund approved! 🎉", "退款已批准！🎉"),
            description: t(
              `Your refund has been automatically processed. Based on your remaining balance, the amount of ${formatCredits(amount)} will be credited to your account.`,
              `退款已自动处理。根据剩余余额，${formatCredits(amount)} 将退还至你的账户。`,
            ),
          });
        } else {
          toast({
            title: t("Refund Request Received", "已收到退款申请"),
            description: t(
              "We have received your refund request. A member of our team will review it and reach out via email shortly.",
              "我们已收到你的退款申请。团队成员将审核并尽快通过电子邮件联系你。",
            ),
          });
        }
      })
      .catch(toastOnFail(t("refund transaction", "申请交易退款")));

  useEffect(() => {
    if (api && topupStatus === "success") {
      api.fulfillCheckout().catch(notifyCheckoutFailure);
    }
  }, [api, topupStatus, notifyCheckoutFailure]);

  const openBillingPortal = () =>
    api
      .getUserPaymentPortalLink()
      .then((portal) => {
        router.push(portal.url);
      })
      .catch(toastOnFail(t("open billing portal", "打开账单门户")));

  const submitTopUp = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isRequestingTopUp || checkoutRedirect.isRedirecting) return;
    const form = e.currentTarget;
    const amount =
      parseInt(new FormData(form).get("topUpAmount") as string) * 100;
    setIsRequestingTopUp(true);
    requestTopUp(amount)
      .then(() => checkoutRedirect.markRedirecting())
      .catch(toastOnFail(t("request top-up", "申请充值")))
      .finally(() => setIsRequestingTopUp(false));
  };

  const submitAutoTopUpConfig = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);
    const amount = parseInt(formData.get("topUpAmount") as string) * 100;
    const threshold = parseInt(formData.get("threshold") as string) * 100;
    updateAutoTopUpConfig(amount, threshold)
      .then(() => {
        toast({
          title: t("Auto top-up config updated! 🎉", "自动充值设置已更新！🎉"),
        });
      })
      .catch(toastOnFail(t("update auto top-up config", "更新自动充值设置")));
  };

  return (
    <div className="w-full px-4 sm:px-8 md:min-w-[800px]">
      <h1 className="mb-6 text-heading leading-inherit font-normal text-foreground-strong sm:mb-8 sm:text-title sm:leading-inherit">
        {t("Billing", "账单")}
      </h1>

      {/* Subscription Tier */}
      <div className="mb-8">
        <SubscriptionTierSection />
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        {/* Top-up Form */}
        <div className="space-y-4">
          <Text variant="lead-medium" as="h3" tone="inherit">
            {t("Top-up Credits", "充值积分")}
          </Text>

          <p className="mb-6 text-foreground-secondary">
            {topupStatus === "success" && (
              <span className="text-success">
                {t(
                  "Your payment was successful. Your credits will be updated shortly. Try refreshing the page in case it is not updated.",
                  "支付成功，积分即将更新。若尚未更新，请尝试刷新页面。",
                )}
              </span>
            )}
            {topupStatus === "cancel" && (
              <span className="text-error">
                {t(
                  "Payment failed. Your payment method has not been charged.",
                  "支付失败，未从你的支付方式扣款。",
                )}
              </span>
            )}
          </p>

          <form onSubmit={submitTopUp} className="space-y-4">
            <div>
              <label
                htmlFor="topUpAmount"
                className="mb-1 block text-foreground-body"
              >
                {t(
                  "Top-up amount (USD), minimum $5:",
                  "充值金额（USD），最低 $5：",
                )}
              </label>
              <input
                type="number"
                id="topUpAmount"
                name="topUpAmount"
                placeholder={t("Enter top-up amount", "输入充值金额")}
                min="5"
                step="1"
                defaultValue={5}
                className="w-full rounded-md border border-border-base px-4 py-2"
                required
              />
            </div>

            <Button
              variant="compact-primary"
              size="compact"
              type="submit"
              className="w-full"
              disabled={isRequestingTopUp || checkoutRedirect.isRedirecting}
            >
              {t("Top-up", "充值")}
            </Button>
          </form>

          {/* Auto Top-up Form */}
          <form onSubmit={submitAutoTopUpConfig} className="my-6 space-y-4">
            <Text variant="lead-medium" as="h3" tone="inherit">
              {t("Automatic Refill Settings", "自动充值设置")}
            </Text>

            <div>
              <label
                htmlFor="threshold"
                className="mb-1 block text-foreground-body"
              >
                {t(
                  "When my balance goes below this amount:",
                  "当余额低于以下金额时：",
                )}
              </label>
              <input
                type="number"
                id="threshold"
                name="threshold"
                defaultValue={
                  autoTopUpConfig?.threshold
                    ? autoTopUpConfig.threshold / 100
                    : ""
                }
                placeholder={t(
                  "Refill threshold, minimum $5",
                  "充值阈值，最低 $5",
                )}
                min="5"
                step="1"
                className="w-full rounded-md border border-border-base px-4 py-2"
                required
              />
            </div>

            <div>
              <label
                htmlFor="autoTopUpAmount"
                className="mb-1 block text-foreground-body"
              >
                {t(
                  "Automatically refill my balance with this amount:",
                  "自动向余额充值以下金额：",
                )}
              </label>
              <input
                type="number"
                id="autoTopUpAmount"
                name="topUpAmount"
                defaultValue={
                  autoTopUpConfig?.amount ? autoTopUpConfig.amount / 100 : ""
                }
                placeholder={t(
                  "Refill amount, minimum $5",
                  "充值金额，最低 $5",
                )}
                min="5"
                step="1"
                className="w-full rounded-md border border-border-base px-4 py-2"
                required
              />
            </div>

            <Text variant="body-tight" tone="inherit">
              <b>{t("Note:", "注意：")}</b>{" "}
              {t(
                "For your safety, we will top up your balance",
                "为保障安全，每次工作流运行期间，余额自动充值",
              )}{" "}
              <b>{t("at most once", "最多一次")}</b>{" "}
              {t(
                "per workflow execution to prevent unintended excessive charges. Therefore, ensure that the automatic top-up amount is sufficient for your workflow's operation.",
                "，以避免意外产生过多费用。因此，请确保自动充值金额足以支持工作流运行。",
              )}
            </Text>

            {autoTopUpConfig?.amount ? (
              <>
                <Button
                  variant="compact-primary"
                  size="compact"
                  type="submit"
                  className="w-full"
                >
                  {t("Save Changes", "保存更改")}
                </Button>
                <Button
                  className="w-full"
                  variant="compact-destructive"
                  size="compact"
                  onClick={() =>
                    updateAutoTopUpConfig(0, 0).then(() => {
                      toast({
                        title: t(
                          "Auto top-up config disabled! 🎉",
                          "自动充值已停用！🎉",
                        ),
                      });
                    })
                  }
                >
                  {t("Disable Auto-Refill", "停用自动充值")}
                </Button>
              </>
            ) : (
              <Button
                variant="compact-primary"
                size="compact"
                type="submit"
                className="w-full"
              >
                {t("Enable Auto-Refill", "启用自动充值")}
              </Button>
            )}
          </form>

          {/* Expert Usage Limits */}
          <CoPilotUsageSection />
        </div>

        <div className="my-6 space-y-4">
          {/* Payment Portal */}

          <Text variant="lead-medium" as="h3" tone="inherit">
            {t("Manage Your Payment Methods", "管理支付方式")}
          </Text>
          <p className="text-foreground-secondary">
            {t(
              "You can manage your cards and see your payment history in the billing portal.",
              "你可以在账单门户中管理银行卡并查看支付记录。",
            )}
          </p>
          <Button
            variant="compact-primary"
            size="compact"
            type="submit"
            className="w-full"
            onClick={() => openBillingPortal()}
          >
            {t("Open Portal", "打开账单门户")}
          </Button>

          {/* Transaction History */}

          <Text variant="lead-medium" as="h3" tone="inherit">
            {t("Transaction History", "交易记录")}
          </Text>
          {transactionHistory.transactions.length === 0 && (
            <p className="text-foreground-secondary">
              {t("No transactions found.", "未找到交易记录。")}
            </p>
          )}
          <Table
            className={
              transactionHistory.transactions.length === 0 ? "hidden" : ""
            }
          >
            <TableHeader>
              <TableRow>
                <TableHead>{t("Date", "日期")}</TableHead>
                <TableHead>{t("Description", "描述")}</TableHead>
                <TableHead>{t("Amount", "金额")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactionHistory.transactions.map((transaction, i) => (
                <TableRow key={i}>
                  <TableCell>
                    {new Date(transaction.transaction_time).toLocaleString(
                      locale,
                      {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                        hour: "numeric",
                        minute: "numeric",
                      },
                    )}
                  </TableCell>
                  <TableCell>{transaction.description}</TableCell>
                  {/* Make it green if it's positive, red if it's negative */}
                  <TableCell>
                    <b
                      className={
                        transaction.amount > 0 ? "text-success" : "text-error"
                      }
                    >
                      {formatCredits(transaction.amount)}
                    </b>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {transactionHistory.next_transaction_time && (
            <Button
              variant="compact-primary"
              size="compact"
              type="submit"
              className="w-full"
              onClick={() => fetchTransactionHistory()}
            >
              {t("Load More", "加载更多")}
            </Button>
          )}

          {refundRequests.length > 0 && (
            <>
              <Text variant="lead-medium" as="h3" tone="inherit">
                {t("Your Refund Requests", "你的退款申请")}
              </Text>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("Last Updated", "上次更新")}</TableHead>
                    <TableHead>{t("Amount", "金额")}</TableHead>
                    <TableHead>{t("Status", "状态")}</TableHead>
                    <TableHead>{t("Comment", "备注")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {refundRequests.map((request, i) => (
                    <TableRow key={i}>
                      <TableCell>
                        {new Date(request.updated_at).toLocaleString(locale, {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                          hour: "numeric",
                          minute: "numeric",
                        })}
                      </TableCell>
                      <TableCell>{formatCredits(request.amount)}</TableCell>
                      <TableCell>{request.status}</TableCell>
                      <TableCell>{request.result}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </>
          )}

          <Button
            variant="compact-destructive"
            size="compact"
            onClick={() => openRefundModal()}
            className="w-full"
          >
            {t("Request Refund", "申请退款")}
          </Button>
          <RefundModal
            isOpen={isRefundModalOpen}
            onClose={() => setIsRefundModalOpen(false)}
            transactions={topUpTransactions}
            formatCredits={formatCredits}
            refundCredits={refundCredits}
          />
        </div>
      </div>
    </div>
  );
}
