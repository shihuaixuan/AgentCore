"use client";

import { Text } from "@/components/atoms/Text/Text";
import { useTranslation } from "@/lib/i18n/LanguageProvider";

export function OAuthAppsHeader() {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col gap-2">
      <Text variant="h3">{t("OAuth Applications", "OAuth 应用")}</Text>
      <Text variant="large">
        {t(
          "Manage your OAuth applications that use the AutoGPT Platform API",
          "管理使用 AutoGPT 平台 API 的 OAuth 应用",
        )}
      </Text>
    </div>
  );
}
