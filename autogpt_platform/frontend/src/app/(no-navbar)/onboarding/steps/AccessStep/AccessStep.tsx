"use client";

import { useTranslation } from "@/lib/i18n/LanguageProvider";

import { FadeIn } from "@/components/atoms/FadeIn/FadeIn";
import { Text } from "@/components/atoms/Text/Text";
import { useAccessStep } from "./useAccessStep";

/**
 * Right after signing up with a provider whose data Otto can use, offers that
 * connection. Its place in the wizard comes from the step order, so it can
 * move without changing this step.
 */
export function AccessStep() {
  const { t } = useTranslation();
  const { access, handleContinue } = useAccessStep();
  if (!access) return null;
  const { Connect } = access;

  return (
    <FadeIn>
      <div className="flex w-full max-w-xl flex-col items-center gap-6 px-4">
        <div className="flex flex-col items-center gap-3 text-center">
          <Text variant="h4" as="h1">
            {t(access.title, "同时连接 Microsoft 365？")}
          </Text>
          <Text variant="large" as="p" tone="muted" className="max-w-md">
            {t(
              access.description,
              "使用 Microsoft 登录仅用于验证身份。连接后，Otto 才能使用你的 Microsoft 365。你可以随时在设置中更改。",
            )}
          </Text>
        </div>
        <div className="w-full">
          <Connect onDone={handleContinue} onSkip={handleContinue} />
        </div>
      </div>
    </FadeIn>
  );
}
