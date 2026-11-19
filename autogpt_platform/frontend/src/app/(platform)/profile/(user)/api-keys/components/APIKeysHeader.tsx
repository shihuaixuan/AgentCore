"use client";

import { CardDescription, CardTitle } from "@/components/atoms/Card/Card";
import { useTranslation } from "@/lib/i18n/LanguageProvider";

export function APIKeysHeader() {
  const { t } = useTranslation();
  return (
    <>
      <CardTitle>
        {t("AutoGPT Platform API Keys", "AutoGPT 平台 API 密钥")}
      </CardTitle>
      <CardDescription>
        {t(
          "Manage your AutoGPT Platform API keys for programmatic access",
          "管理用于程序化访问的 AutoGPT 平台 API 密钥",
        )}
      </CardDescription>
    </>
  );
}
