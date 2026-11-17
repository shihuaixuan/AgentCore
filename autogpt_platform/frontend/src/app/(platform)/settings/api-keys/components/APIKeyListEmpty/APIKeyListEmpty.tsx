"use client";

import { useTranslation } from "@/lib/i18n/LanguageProvider";
import { Text } from "@/components/atoms/Text/Text";

import { APIKeyMarquee } from "./components/APIKeyMarquee";

export function APIKeyListEmpty() {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col items-center justify-center gap-4 px-6 py-10 text-center">
      <APIKeyMarquee />
      <div className="flex flex-col items-center gap-1">
        <Text variant="large-medium" as="span">
          {t("No API key found", "未找到 API 密钥")}
        </Text>
        <Text variant="body" tone="muted" className="max-w-[360px]">
          You haven&apos;t created an API key yet. Create one to start using the
          AutoGPT Platform API.
        </Text>
      </div>
    </div>
  );
}
