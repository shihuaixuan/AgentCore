"use client";

import { useTranslation } from "@/lib/i18n/LanguageProvider";

import { Button } from "@/components/atoms/Button/Button";
import { Mic01Icon, PencilEdit01Icon } from "@hugeicons/core-free-icons";

interface Props {
  onTalk: () => void;
  onWrite: () => void;
  writeFirst?: boolean;
}

// The two ways to tell Otto about your work, side by side, so neither
// is hidden behind a link. Talking leads, unless the microphone failed.
export function RestActions({ onTalk, onWrite, writeFirst = false }: Props) {
  const { t } = useTranslation();
  return (
    <div className="mt-4 flex items-center gap-3">
      <Button
        type="button"
        variant={writeFirst ? "secondary" : "primary"}
        size="small"
        onClick={onTalk}
        leadingIcon={Mic01Icon}
        className="h-10 w-36"
      >
        {t("Talk", "语音讲述")}
      </Button>
      <Button
        type="button"
        variant={writeFirst ? "primary" : "secondary"}
        size="small"
        onClick={onWrite}
        leadingIcon={PencilEdit01Icon}
        className="h-10 w-36"
      >
        {t("Write", "文字输入")}
      </Button>
    </div>
  );
}
