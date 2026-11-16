"use client";

import { useTranslation } from "@/lib/i18n/LanguageProvider";

import { Button } from "@/components/atoms/Button/Button";
import { Text } from "@/components/atoms/Text/Text";
import { SwapFade } from "@/components/atoms/SwapFade/SwapFade";
import type { ScreenState } from "../useBrainDumpStep";

interface Props {
  screen: ScreenState;
  submittedMode: "voice" | "typed";
  onTypeInstead: () => void;
  onRecordInstead: () => void;
  onTypeInsteadOfRecovered: () => void;
}

// The quiet way across to the other mode, under the main controls.
export function ModeSwitchLink({
  screen,
  submittedMode,
  onTypeInstead,
  onRecordInstead,
  onTypeInsteadOfRecovered,
}: Props) {
  const { t } = useTranslation();
  if (screen !== "typing" && screen !== "failed" && screen !== "recovery") {
    return null;
  }

  return (
    <div className="flex justify-center">
      <SwapFade swapKey={screen}>
        {screen === "failed" && (
          <LinkButton onClick={onTypeInstead}>
            {submittedMode === "typed"
              ? t("edit your text", "编辑文字")
              : t("type instead", "改用文字")}
          </LinkButton>
        )}
        {/* Kept while the microphone is refused: it asks the browser again
            rather than going back to an orb that would only be refused. */}
        {screen === "typing" && (
          <LinkButton onClick={onRecordInstead}>
            {t("record instead", "改用录音")}
          </LinkButton>
        )}
        {screen === "recovery" && (
          <LinkButton onClick={onTypeInsteadOfRecovered}>
            {t("type instead", "改用文字")}
          </LinkButton>
        )}
      </SwapFade>
    </div>
  );
}

function LinkButton({
  onClick,
  children,
}: {
  onClick: () => void;
  children: string;
}) {
  return (
    <Button variant="ghost" size="xs" onClick={onClick}>
      <Text variant="small-medium-loose-underline" as="span">
        {children}
      </Text>
    </Button>
  );
}
