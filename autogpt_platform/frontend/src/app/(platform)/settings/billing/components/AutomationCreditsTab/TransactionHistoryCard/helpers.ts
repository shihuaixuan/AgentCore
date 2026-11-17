import type { useTranslation } from "@/lib/i18n/LanguageProvider";
import type { CreditTransactionItem } from "@/app/api/__generated__/models/creditTransactionItem";
import { formatCents } from "../../../helpers";

export type Transaction = CreditTransactionItem & {
  id: string;
  amount: number;
  transaction_type: NonNullable<CreditTransactionItem["transaction_type"]>;
  receipt_as_of?: string | Date | null;
};

function transactionNames(
  t: ReturnType<typeof useTranslation>["t"],
): Record<string, string> {
  return {
    TOP_UP: t("Credits added", "积分已充值"),
    GRANT: t("Credits granted", "赠送积分"),
    REFUND: t("Top-up refunded", "充值已退款"),
    SUBSCRIPTION: t("Subscription payment", "订阅付款"),
    CARD_CHECK: t("Card verification", "银行卡验证"),
  };
}

export function activityName(
  transaction: Transaction,
  t: ReturnType<typeof useTranslation>["t"] = (english) => english,
): string {
  if (transaction.activity_type === "agent_run")
    return transaction.agent_name || t("Workflow unavailable", "工作流不可用");
  if (transaction.activity_type === "copilot_tools")
    return t("Expert tool use", "专家工具使用");
  if (transaction.activity_type === "block_usage")
    return t("Direct block usage", "直接使用模块");
  if (transaction.transaction_type === "USAGE")
    return transaction.description || t("Credit usage", "积分使用");
  return (
    transactionNames(t)[transaction.transaction_type] ||
    t("Credit balance change", "积分余额变动")
  );
}

export function activityDescription(
  transaction: Transaction,
  t: ReturnType<typeof useTranslation>["t"] = (english) => english,
): string {
  if (transaction.parent_agent_name)
    return t(
      `Part of ${transaction.parent_agent_name}`,
      `属于 ${transaction.parent_agent_name}`,
    );
  if (transaction.activity_type === "agent_run")
    return t("Workflow run", "工作流运行");
  if (transaction.activity_type === "copilot_tools")
    return (
      transaction.conversation_title || t("Paid block tools", "付费模块工具")
    );
  if (transaction.activity_type === "block_usage")
    return t("Outside a workflow run", "在工作流运行之外");
  if (transaction.transaction_type === "TOP_UP")
    return t("Credit purchase", "购买积分");
  if (transaction.transaction_type === "REFUND")
    return t("Credit purchase refunded", "积分购买已退款");
  if (transaction.transaction_type === "SUBSCRIPTION")
    return t("Paid from credit balance", "从积分余额支付");
  return t("Credit balance", "积分余额");
}

export function formatAmount(amount: number): string {
  const sign = amount < 0 ? "−" : amount > 0 ? "+" : "";
  return `${sign}${formatCents(Math.abs(amount))}`;
}

export function formatActivityDate(
  value: string | Date | null | undefined,
  t: ReturnType<typeof useTranslation>["t"] = (english) => english,
  locale?: string,
) {
  if (!value)
    return {
      date: t("Unavailable", "不可用"),
      time: "",
      full: t("Date unavailable", "日期不可用"),
    };
  const date = new Date(value);
  if (Number.isNaN(date.getTime()))
    return {
      date: t("Unavailable", "不可用"),
      time: "",
      full: t("Date unavailable", "日期不可用"),
    };
  return {
    date: date.toLocaleDateString(locale, {
      month: "short",
      day: "numeric",
      year: "numeric",
    }),
    time: date.toLocaleTimeString(locale, {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    }),
    full: date.toLocaleString(locale, {
      dateStyle: "long",
      timeStyle: "long",
    }),
  };
}

export function libraryHref(libraryID: string | null | undefined) {
  return libraryID ? `/library/agents/${encodeURIComponent(libraryID)}` : null;
}

export function taskHref(transaction: Transaction) {
  const agentHref = libraryHref(transaction.library_agent_id);
  if (
    !agentHref ||
    !transaction.execution_available ||
    !transaction.usage_execution_id
  )
    return null;
  return `${agentHref}?activeTab=runs&activeItem=${encodeURIComponent(transaction.usage_execution_id)}`;
}

export function isRunActive(transaction: Transaction) {
  return ["QUEUED", "RUNNING", "REVIEW", "INCOMPLETE"].includes(
    transaction.execution_status || "",
  );
}

export function statusLabel(
  status: string,
  t: ReturnType<typeof useTranslation>["t"] = (english) => english,
) {
  const labels: Record<string, string> = {
    QUEUED: t("Queued", "排队中"),
    RUNNING: t("Running", "运行中"),
    REVIEW: t("Needs review", "待审核"),
    INCOMPLETE: t("Incomplete", "未完成"),
    COMPLETED: t("Completed", "已完成"),
    FAILED: t("Failed", "失败"),
    TERMINATED: t("Stopped", "已停止"),
  };
  return labels[status] || t("Unavailable", "不可用");
}

export function receiptNote(
  transaction: Transaction,
  t: ReturnType<typeof useTranslation>["t"] = (english) => english,
) {
  if (transaction.activity_type === "agent_run") {
    if (isRunActive(transaction))
      return t(
        "This run is still active. Charges and adjustments may continue.",
        "此运行尚未结束，费用和调整可能继续产生。",
      );
    if (transaction.amount === 0)
      return t(
        "No net change to your credit balance.",
        "你的积分余额净变化为零。",
      );
    return t(
      "Recorded charges and adjustments for this run.",
      "此运行已记录的费用和调整。",
    );
  }
  if (transaction.activity_type === "copilot_tools")
    return t(
      "Paid block tools across this conversation. Subscription usage is tracked separately.",
      "此对话中使用的付费模块工具。订阅用量单独统计。",
    );
  if (transaction.activity_type === "block_usage")
    return t(
      "A paid block call without an associated workflow run.",
      "未关联工作流运行的付费模块调用。",
    );
  if (transaction.transaction_type === "REFUND")
    return t(
      "Credits removed from your balance after the payment was refunded.",
      "付款退款后，相关积分已从余额中扣除。",
    );
  if (transaction.transaction_type === "SUBSCRIPTION")
    return t(
      "This payment was taken from your credit balance.",
      "此笔付款已从你的积分余额中扣除。",
    );
  if (transaction.amount === 0)
    return t("No change to your credit balance.", "你的积分余额没有变化。");
  return "";
}

export function chargeLabel(
  type: string,
  t: ReturnType<typeof useTranslation>["t"] = (english) => english,
) {
  const labels: Record<string, string> = {
    usage: t("Block usage", "模块用量"),
    execution_fee: t("Execution fee", "运行费用"),
    adjustment: t("Usage adjustment", "用量调整"),
    transaction: t("Balance change", "余额变动"),
  };
  return labels[type] || t("Balance change", "余额变动");
}
