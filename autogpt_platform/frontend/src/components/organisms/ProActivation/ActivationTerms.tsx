"use client";
import { useTranslation } from "@/lib/i18n/LanguageProvider";
import type { ActivationTerms as Terms } from "@/app/api/__generated__/models/activationTerms";
import { Text } from "@/components/atoms/Text/Text";
import { trialEndNotice } from "./display-helpers";
import { ActivationSummary } from "./ActivationSummary";
import { ActivationTimeline } from "./ActivationTimeline";
import { RenewalDetails } from "./RenewalDetails";

interface Props {
  terms: Terms;
}

export function ActivationTerms({ terms }: Props) {
  const { locale } = useTranslation();
  return (
    <div data-slot="activation-terms" className="space-y-5">
      <Text variant="body" tone="secondary" className="leading-relaxed">
        {trialEndNotice(terms, locale)}
      </Text>
      <ActivationSummary terms={terms} />
      <ActivationTimeline terms={terms} />
      <RenewalDetails terms={terms} />
    </div>
  );
}
