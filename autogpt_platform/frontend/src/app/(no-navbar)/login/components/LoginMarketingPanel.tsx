"use client";

import { AuthMarketingPanel } from "@/components/auth/AuthSplitLayout/AuthMarketingPanel";
import { useTranslation } from "@/lib/i18n/LanguageProvider";
import { LoginWhatsNew } from "./LoginWhatsNew/LoginWhatsNew";

export function LoginMarketingPanel() {
  const { t } = useTranslation();
  return (
    <AuthMarketingPanel
      headingLines={[t("Welcome back", "欢迎回来")]}
      description={t(
        "Pick up where you left off. Your experts are waiting.",
        "继续上次的工作，你的专家团队已准备就绪。",
      )}
    >
      <LoginWhatsNew />
    </AuthMarketingPanel>
  );
}
