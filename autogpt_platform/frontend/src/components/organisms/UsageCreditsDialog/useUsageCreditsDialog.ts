"use client";

import { useUsageExperience } from "@/services/usageExperience/useUsageExperience";
import { getChatAllowance, getUsageCreditsAnswers } from "./helpers";
import { useTranslation } from "@/lib/i18n/LanguageProvider";

export function useUsageCreditsDialog() {
  const { locale } = useTranslation();
  // The same flag the wallet reads to show Add credits, and the same plan
  // state the billing page's usage card reads.
  const { experience, usage, isBillingEnabled, isLoading, isError } =
    useUsageExperience();
  // Until usage and, for a trial, its trial status have loaded, the plan's
  // limits are unknown; isError covers a trial status that failed to load.
  const settled = !isLoading && !isError;
  return {
    answers: getUsageCreditsAnswers({
      locale,
      paymentEnabled: isBillingEnabled === true,
      allowance: getChatAllowance(experience, settled ? usage : undefined),
      isTrial: experience.isActiveTrial,
    }),
  };
}
