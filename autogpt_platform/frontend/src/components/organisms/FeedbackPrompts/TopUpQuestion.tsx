"use client";
import { DISPLAY_LABELS } from "./display-labels";
import { useTranslation } from "@/lib/i18n/LanguageProvider";

import { ReasonFlow } from "./components/ReasonFlow";
import { TOP_UP_REASONS } from "./helpers";

export const TOP_UP_QUESTION = "What would make topping up worth it?";

interface Props {
  onReason?: (value: string) => void;
  onSubmit?: (answer: { reason: string; note: string }) => void;
}

// Asked inside the out-of-credits dialog, after "Not now".
export function TopUpQuestion({ onReason, onSubmit }: Props) {
  const { t } = useTranslation();
  return (
    <ReasonFlow
      reasons={TOP_UP_REASONS}
      label={t(
        TOP_UP_QUESTION,
        DISPLAY_LABELS[TOP_UP_QUESTION] ?? TOP_UP_QUESTION,
      )}
      size="compact"
      onReason={onReason}
      onSubmit={onSubmit}
    />
  );
}
