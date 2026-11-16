"use client";

import { useTranslation } from "@/lib/i18n/LanguageProvider";

import { Text } from "@/components/atoms/Text/Text";
import { MicrosoftConnectionPanel } from "@/components/contextual/MicrosoftConnection/MicrosoftConnectionPanel";
import { useMicrosoftBrowserSignIn } from "@/components/contextual/MicrosoftConnection/useMicrosoftBrowserSignIn";
import type { AccessConnectProps } from "../accessProviders";

export function MicrosoftAccess({ onDone, onSkip }: AccessConnectProps) {
  const { t } = useTranslation();
  const { browserAvailable, isLoading } = useMicrosoftBrowserSignIn();

  // Until the server says which sign-in it supports, either button could be wrong.
  if (isLoading)
    return (
      <Text variant="body" role="status" tone="muted">
        {t("Loading…", "加载中…")}
      </Text>
    );

  return (
    <MicrosoftConnectionPanel
      browserAvailable={browserAvailable}
      doneLabel="Continue"
      onDone={() => onDone()}
      onSkip={onSkip}
    />
  );
}
