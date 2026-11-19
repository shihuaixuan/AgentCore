"use client";

import { useTranslation } from "@/lib/i18n/LanguageProvider";
import type { TrialStatusResponse } from "@/app/api/__generated__/models/trialStatusResponse";
import { Icon } from "@/components/atoms/Icon/Icon";
import { Text } from "@/components/atoms/Text/Text";
import { CreditCardIcon } from "@hugeicons/core-free-icons";
import { formatTrialEndDate } from "@/components/organisms/TrialCard/helpers";
import { getTrialPlanLine } from "../helpers";

interface Props {
  id: string;
  trial: TrialStatusResponse | undefined;
}

export function WalletTrialNote({ id, trial }: Props) {
  const { t, locale } = useTranslation();
  const englishLine = getTrialPlanLine(trial);
  const date = trial?.ends_at
    ? formatTrialEndDate(trial.ends_at, locale)
    : null;
  const line = englishLine
    ? t(
        englishLine,
        trial?.cancel_at_period_end
          ? `试用将于 ${date} 结束`
          : date
            ? `套餐将于 ${date} 开始`
            : "试用结束后套餐将自动开始",
      )
    : null;
  if (!line) return null;

  return (
    <div id={id} className="flex items-center gap-2 px-5 pt-4">
      <Icon
        icon={CreditCardIcon}
        size={16}
        aria-hidden
        tone="muted"
        className="shrink-0"
      />
      <Text variant="small" tone="secondary">
        {line}
      </Text>
    </div>
  );
}
