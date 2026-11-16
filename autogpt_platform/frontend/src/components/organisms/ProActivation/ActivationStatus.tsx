"use client";

import { useTranslation } from "@/lib/i18n/LanguageProvider";
import type { ActivationResponse } from "@/app/api/__generated__/models/activationResponse";
import { Button } from "@/components/atoms/Button/Button";
import { Text } from "@/components/atoms/Text/Text";
import { Icon } from "@/components/atoms/Icon/Icon";
import {
  CheckmarkCircle02Icon,
  Loading03Icon,
  Shield01Icon,
} from "@hugeicons/core-free-icons";
import { invoiceURL } from "@/services/pro-activation/helpers";

interface Props {
  attempt: ActivationResponse | null;
  isReady: boolean;
  hasFreshUsage: boolean;
  plan: "Pro" | "Max";
  isBusy: boolean;
  check: () => Promise<void>;
  close: () => void;
}

export function ActivationStatus({
  attempt,
  isReady,
  hasFreshUsage,
  plan,
  isBusy,
  check,
  close,
}: Props) {
  const { t } = useTranslation();
  const url = invoiceURL(attempt?.hosted_invoice_url);
  const payment =
    attempt?.status === "payment_required" ||
    attempt?.status === "action_required";
  const failed = attempt?.status === "failed";
  const notApplicable = attempt?.status === "not_applicable";
  const needsSupport = ["recovery_required", "terms_changed"].includes(
    attempt?.error_code ?? "",
  );
  return (
    <div data-slot="activation-status" className="space-y-6">
      <div
        data-slot="activation-status-panel"
        className="rounded-xlarge border border-border-base bg-surface-muted p-5"
      >
        <Icon
          icon={
            isReady
              ? CheckmarkCircle02Icon
              : payment
                ? Shield01Icon
                : Loading03Icon
          }
          size={24}
          tone="brand"
          spin={!isReady && !payment && !failed && !notApplicable}
          className="mb-4"
        />
        <Text variant="body" tone="body">
          {isReady
            ? hasFreshUsage
              ? t(
                  `Your ${plan} plan is active with fresh daily and weekly allowances. Your conversations and work are right where you left them.`,
                  `你的 ${plan} 套餐已启用，每日和每周额度已重置。对话和工作内容均保留在原处。`,
                )
              : t(
                  `Your ${plan} plan is active. Your existing usage still counts toward your plan’s limits.`,
                  `你的 ${plan} 套餐已启用。已使用的额度仍计入套餐额度上限。`,
                )
            : notApplicable
              ? t(
                  "This activation no longer applies to your current plan. Check Billing for your current plan and payment details.",
                  "此次激活已不适用于当前套餐。请前往账单设置查看当前套餐和付款详情。",
                )
              : payment
                ? t(
                    "Complete payment securely with Stripe using your existing invoice. It opens in a new tab, keeping your draft here while we check your activation.",
                    "请通过现有账单在 Stripe 安全完成付款。页面将在新标签页打开；我们检查激活状态时，你的草稿会保留在此处。",
                  )
                : failed
                  ? t(
                      "This payment was canceled or could not be completed. Your usage has not been reset.",
                      "此次付款已取消或未能完成，用量额度尚未重置。",
                    )
                  : needsSupport
                    ? t(
                        "We need to verify your existing payment before you can continue. Contact support; please don’t start another purchase.",
                        "继续前需要核实现有付款。请联系客服，暂时不要再次购买。",
                      )
                    : t(
                        `We’re confirming your payment and preparing your ${plan} allowance. You can close this window; we’ll keep checking.`,
                        `正在确认付款并准备你的 ${plan} 额度。你可以关闭此窗口，我们会继续检查。`,
                      )}
        </Text>
      </div>
      {notApplicable && (
        <Button
          as="NextLink"
          href="/settings/billing"
          variant="primary"
          className="w-full"
          onClick={close}
        >
          {t("View my plan", "查看我的套餐")}
        </Button>
      )}
      {url && payment && (
        <Button
          as="NextLink"
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          variant="primary"
          className="w-full"
        >
          {attempt?.status === "action_required"
            ? t("Verify payment securely", "安全验证付款")
            : t("Complete payment securely", "安全完成付款")}
        </Button>
      )}
      {needsSupport && (
        <Button
          as="NextLink"
          href="mailto:contact@agpt.co"
          variant="primary"
          className="w-full"
        >
          {t("Contact support", "联系客服")}
        </Button>
      )}
      <Button
        onClick={() => (isReady || failed || notApplicable ? close() : check())}
        disabled={isBusy}
        loading={isBusy}
        variant={isReady ? "primary" : "secondary"}
        className="w-full"
      >
        {isReady
          ? t("Continue where you left off", "返回并继续工作")
          : failed || notApplicable
            ? t("Back to your work", "返回工作")
            : t("Check activation status", "检查激活状态")}
      </Button>
    </div>
  );
}
