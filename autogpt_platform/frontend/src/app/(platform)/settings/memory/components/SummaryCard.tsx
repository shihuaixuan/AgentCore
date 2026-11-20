"use client";

import { AUTOPILOT_NAME } from "@/lib/branding";
import { useTranslation } from "@/lib/i18n/LanguageProvider";
import { Button } from "@/components/atoms/Button/Button";
import { Text } from "@/components/atoms/Text/Text";

interface Props {
  scopeExpertID: string | null;
  scopeName: string;
  onViewSummary: () => void;
}

export function SummaryCard({
  scopeExpertID,
  scopeName,
  onViewSummary,
}: Props) {
  const { t } = useTranslation();
  const isAutoPilot = scopeExpertID === null;
  return (
    <div className="flex flex-col gap-3 rounded-large border border-border-base bg-surface px-4 py-4 shadow-message-table sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 flex-col">
        <Text variant="body-medium" as="span">
          {t("Memory summary", "记忆摘要")}
        </Text>
        <Text variant="small" as="span" tone="muted">
          {isAutoPilot
            ? t(
                `Ask ${AUTOPILOT_NAME} what it knows about you. Opens a chat — you can correct or forget anything from there.`,
                `询问 ${AUTOPILOT_NAME} 对你的了解。这会打开聊天，你可以在其中纠正内容或让 ${AUTOPILOT_NAME} 忘记任何信息。`,
              )
            : t(
                `Ask ${scopeName} what they know about you and their work. Opens a chat.`,
                `询问 ${scopeName} 对你和工作内容的了解。这会打开聊天。`,
              )}
        </Text>
      </div>
      <Button variant="primary" size="small" onClick={onViewSummary}>
        {isAutoPilot
          ? t("View my summary", "查看我的摘要")
          : t(`View ${scopeName}'s summary`, `查看 ${scopeName} 的摘要`)}
      </Button>
    </div>
  );
}
