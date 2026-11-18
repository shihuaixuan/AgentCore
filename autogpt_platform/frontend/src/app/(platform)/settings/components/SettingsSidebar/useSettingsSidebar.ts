import { useIsBillingEnabled } from "@/hooks/useIsBillingEnabled";
import { usePathname } from "next/navigation";
import { settingsNavItems } from "./helpers";
import { useTranslation } from "@/lib/i18n/LanguageProvider";

const NAV_LABELS: Record<string, string> = {
  Profile: "个人资料",
  Account: "账户",
  Memory: "记忆",
  Billing: "账单",
  "Chat models": "聊天模型",
  Bots: "机器人",
  "AutoGPT API Keys": "AutoGPT API 密钥",
  "Creator Dashboard": "创作者面板",
};

export function useSettingsSidebar() {
  const { t } = useTranslation();
  const pathname = usePathname();

  const isBillingEnabled = useIsBillingEnabled();

  const items = settingsNavItems
    .filter((item) => item.href !== "/settings/billing" || isBillingEnabled)
    .map((item) => ({
      ...item,
      label: t(item.label, NAV_LABELS[item.label] ?? item.label),
      isActive:
        pathname === item.href ||
        (item.href !== "/settings" && pathname.startsWith(`${item.href}/`)),
    }));

  return { items };
}
