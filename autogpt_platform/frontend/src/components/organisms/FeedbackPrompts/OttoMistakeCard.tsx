"use client";
import { useTranslation } from "@/lib/i18n/LanguageProvider";

import { Button } from "@/components/atoms/Button/Button";
import { Text } from "@/components/atoms/Text/Text";
import { AutopilotAvatar } from "@/components/molecules/AutopilotAvatar/AutopilotAvatar";
import { useState } from "react";
import { ReasonFlow } from "./components/ReasonFlow";
import { WORK_REASONS } from "./helpers";

interface Props {
  initialSent?: boolean;
  onReason?: (value: string) => void;
  onSubmit?: (answer: { reason: string; note: string }) => void;
  onDismiss?: () => void;
}

export function OttoMistakeCard({
  initialSent = false,
  onReason,
  onSubmit,
  onDismiss,
}: Props) {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(true);

  function close() {
    setIsOpen(false);
    onDismiss?.();
  }

  if (!isOpen) return null;

  return (
    <div className="flex max-w-xl flex-col gap-4 rounded-2xl border border-border-base bg-surface p-4 shadow-sm">
      <div className="flex items-start gap-3">
        <AutopilotAvatar size={32} className="ring-1 ring-border-base" />
        <div className="flex flex-1 flex-col gap-0.5">
          <Text variant="body-medium" tone="primary">
            {t("Help the team fix this", "帮助团队解决此问题")}
          </Text>
          <Text variant="small" tone="muted">
            {t(
              "I've flagged this chat for review. Which of these went wrong?",
              "我已将此对话标记为待审核。以下哪些方面出了问题？",
            )}
          </Text>
        </div>
        <Button
          variant="ghost"
          size="xs"
          className="-mt-1 -mr-1"
          onClick={close}
        >
          {t("Not now", "暂时不用")}
        </Button>
      </div>
      <ReasonFlow
        reasons={WORK_REASONS}
        label={t("Which of these went wrong?", "以下哪些方面出了问题？")}
        size="compact"
        thanks="Thanks. The team reads every one of these."
        initialSent={initialSent}
        onReason={onReason}
        onSubmit={onSubmit}
      />
    </div>
  );
}
