"use client";

import { MessageAction } from "@/components/organisms/Message/Message";
import { StopIcon, VolumeHighIcon } from "@hugeicons/core-free-icons";
import { Icon } from "@/components/atoms/Icon/Icon";
import { useTTSButton } from "./useTTSButton";
import { useTranslation } from "@/lib/i18n/LanguageProvider";

interface Props {
  text: string;
  sessionID: string | null;
}

export function TTSButton({ text, sessionID }: Props) {
  const { t } = useTranslation();
  const { canSpeak, isPlaying, toggle } = useTTSButton({ text, sessionID });

  if (!canSpeak) return null;

  return (
    <MessageAction
      tooltip={
        isPlaying ? t("Stop reading", "停止朗读") : t("Read aloud", "朗读")
      }
      onClick={toggle}
    >
      {isPlaying ? (
        <Icon icon={StopIcon} size={16} />
      ) : (
        <Icon icon={VolumeHighIcon} size={16} />
      )}
    </MessageAction>
  );
}
