"use client";
import { useTranslation } from "@/lib/i18n/LanguageProvider";

import { Button } from "@/components/atoms/Button/Button";
import { useIsBillingEnabled } from "@/hooks/useIsBillingEnabled";
import { toast as sonnerToast } from "sonner";

export const PAYWALL_TOAST_KEY = "copilot-send-paywall";
const BILLING_PATH = "/settings/billing";

interface DescriptionProps {
  recovery: string;
}

// Rendered inside the Toaster, so it can read whether this install bills at
// all. Without billing (most self-hosted installs) there is no plan to pick
// and /settings/billing is a 404, so it points at whoever runs the server.
export function PaywallToastDescription({ recovery }: DescriptionProps) {
  const { t } = useTranslation();
  const isBillingEnabled = useIsBillingEnabled();
  return isBillingEnabled
    ? t(
        `Choose one to keep chatting — ${recovery}.`,
        `选择一个套餐以继续聊天 — ${recovery}。`,
      )
    : t(
        `Ask whoever runs this server to set one up — ${recovery}.`,
        `请联系服务器管理员设置套餐 — ${recovery}。`,
      );
}

export function PlanRequiredDescription() {
  const { t } = useTranslation();
  const isBillingEnabled = useIsBillingEnabled();
  return isBillingEnabled
    ? t("Choose one to continue.", "选择一个套餐以继续。")
    : t(
        "Ask whoever runs this server to set one up.",
        "请联系服务器管理员设置套餐。",
      );
}

export function PaywallToastAction() {
  const { t } = useTranslation();

  const isBillingEnabled = useIsBillingEnabled();
  if (!isBillingEnabled) return null;
  return (
    <Button
      as="NextLink"
      href={BILLING_PATH}
      size="small"
      variant="secondary"
      onClick={() => sonnerToast.dismiss(PAYWALL_TOAST_KEY)}
    >
      {t("See plans", "查看套餐")}
    </Button>
  );
}
