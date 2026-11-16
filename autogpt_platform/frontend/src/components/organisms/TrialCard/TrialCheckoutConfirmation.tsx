"use client";
import { useTranslation } from "@/lib/i18n/LanguageProvider";

import { Text } from "@/components/atoms/Text/Text";
import { ErrorCard } from "@/components/molecules/ErrorCard/ErrorCard";
import { useTrialCheckoutReturn } from "@/services/trials/useTrialCheckoutReturn";

export function TrialCheckoutConfirmation() {
  const { t } = useTranslation();
  const confirmation = useTrialCheckoutReturn();
  if (confirmation.error)
    return (
      <ErrorCard
        context={t("your trial", "你的试用")}
        responseError={{ message: confirmation.error }}
        onRetry={confirmation.retry}
      />
    );
  if (!confirmation.ready)
    return (
      <Text variant="body" role="status">
        {t(
          "Confirming your trial and card setup…",
          "正在确认试用和银行卡设置…",
        )}
      </Text>
    );
  return null;
}
