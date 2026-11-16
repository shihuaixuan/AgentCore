"use client";

import { useOnboardingTranslation } from "../../../useOnboardingTranslation";

import { useTranslation } from "@/lib/i18n/LanguageProvider";

import { Button } from "@/components/atoms/Button/Button";
import { Text } from "@/components/atoms/Text/Text";

interface Props {
  mode: "voice" | "typed";
  reason: string | null;
  onDownload: () => void;
  onSkip: () => void;
}

// Calm on purpose. The recording is safe in the browser and (once it got
// that far) on the server, which keeps a failed take for 46 hours 30 minutes
// (the hourly sweep then deletes it, within 48 hours), so this is an
// inconvenience, not a loss — the copy and the download button both have to
// make that obvious. Download and retry both read the
// browser's copy. Retrying is the orb itself, so only the secondary exits
// live here. A typed take has no recording, so it gets neither the download
// nor that promise; its text stays in the composer.
export function FailureState({ mode, reason, onDownload, onSkip }: Props) {
  const { translateCopy } = useOnboardingTranslation();
  const { t } = useTranslation();
  return (
    <div className="flex flex-col items-center gap-4 text-center">
      {reason && <Text variant="body">{translateCopy(reason)}</Text>}
      <Text variant="body" tone="muted">
        {mode === "voice"
          ? t("Your recording is safe. Try again.", "录音已安全保存，请重试。")
          : t("Your text is safe. Try again.", "文字已安全保存，请重试。")}
      </Text>
      <div className="flex items-center gap-3">
        {mode === "voice" && (
          <Button variant="primary" size="small" onClick={onDownload}>
            {t("Download recording", "下载录音")}
          </Button>
        )}
        <Button variant="ghost" size="small" onClick={onSkip}>
          {t("Continue without it", "跳过并继续")}
        </Button>
      </div>
    </div>
  );
}
