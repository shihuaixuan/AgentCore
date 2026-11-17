"use client";

import { useTranslation } from "@/lib/i18n/LanguageProvider";

import { Button } from "@/components/atoms/Button/Button";
import { Text } from "@/components/atoms/Text/Text";
import { formatElapsed } from "../helpers";

interface Props {
  durationSecs: number;
  onResume: () => void;
  onDownload: () => void;
  onDiscard: () => void;
}

// Reached when the tab was closed, refreshed or crashed mid-recording, or on
// Back after skipping past a recording. Everything captured is still in
// IndexedDB, so the only question is whether the user wants it.
export function RecoveryPrompt({
  durationSecs,
  onResume,
  onDownload,
  onDiscard,
}: Props) {
  const { t } = useTranslation();
  return (
    <div className="flex w-full max-w-md flex-col items-center gap-4 text-center">
      <Text variant="h5">
        {t("Pick up where you left off?", "继续上次的录音？")}
      </Text>
      <Text variant="body" tone="muted">
        {t(
          `We kept the ${formatElapsed(durationSecs)} you already recorded.`,
          `已保存你之前录制的 ${formatElapsed(durationSecs)} 录音。`,
        )}
      </Text>
      <div className="flex w-full flex-col items-center gap-2">
        <Button size="small" onClick={onResume} className="w-full max-w-xs">
          {t("Use that recording", "使用这段录音")}
        </Button>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="xs" onClick={onDownload}>
            {t("Download recording", "下载录音")}
          </Button>
          <Button variant="ghost" size="xs" onClick={onDiscard}>
            {t("Start over", "重新开始")}
          </Button>
        </div>
      </div>
    </div>
  );
}
