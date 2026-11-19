"use client";

import { Text } from "@/components/atoms/Text/Text";
import { useTranslation } from "@/lib/i18n/LanguageProvider";

export default function SettingsOAuthAppsPage() {
  const { t } = useTranslation();
  return (
    <>
      <Text variant="h4">{t("OAuth Apps", "OAuth 应用")}</Text>
      <Text variant="large" tone="secondary" className="mt-2">
        {t("Coming soon.", "即将推出。")}
      </Text>
    </>
  );
}
