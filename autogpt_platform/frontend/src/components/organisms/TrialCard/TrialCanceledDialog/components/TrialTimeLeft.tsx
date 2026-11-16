"use client";

import { useTranslation } from "@/lib/i18n/LanguageProvider";
import type { TrialStatusResponse } from "@/app/api/__generated__/models/trialStatusResponse";
import {
  describeTrialTimeLeft,
  formatTrialDays,
  formatTrialEnd,
} from "../../helpers";

interface Props {
  endsAt: TrialStatusResponse["ends_at"];
}

export function TrialTimeLeft({ endsAt }: Props) {
  const { t, locale } = useTranslation();
  if (!endsAt)
    return (
      <>
        {t(
          "You still have full access until your trial ends. Nothing changes until then.",
          "试用结束前仍可完整使用，期间不会有任何变化。",
        )}
      </>
    );
  const left = describeTrialTimeLeft(endsAt);
  if (left.kind === "ended")
    return <>{t("Your trial access has ended.", "你的试用权限已到期。")}</>;
  if (left.kind !== "days")
    return (
      <>
        {t(
          `You still have full access until ${left.time} ${left.kind}. Nothing changes until then.`,
          `你仍可完整使用至 ${left.time}${left.kind === "today" ? "（今天）" : "（明天）"}，期间不会有任何变化。`,
        )}
      </>
    );
  return (
    <>
      {t(
        `You still have ${formatTrialDays(left.days)} of full access, until ${formatTrialEnd(endsAt)}. Nothing changes until then.`,
        `你仍有 ${left.days} 天完整使用权限，将于 ${formatTrialEnd(endsAt, locale)} 到期，期间不会有任何变化。`,
      )}
    </>
  );
}
