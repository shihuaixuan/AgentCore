"use client";

import { useTranslation } from "@/lib/i18n/LanguageProvider";
import { Text } from "@/components/atoms/Text/Text";

export function AuthDivider() {
  const { t } = useTranslation();
  return (
    <div className="my-5 flex w-full items-center gap-3">
      <span className="h-px flex-1 bg-surface-active" />
      <Text variant="small-medium" tone="muted">
        {t("or", "或")}
      </Text>
      <span className="h-px flex-1 bg-surface-active" />
    </div>
  );
}
