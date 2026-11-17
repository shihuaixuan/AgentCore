"use client";

import { useTranslation } from "@/lib/i18n/LanguageProvider";

import { Icon } from "@/components/atoms/Icon/Icon";
import { Text } from "@/components/atoms/Text/Text";
import { MicOff01Icon } from "@hugeicons/core-free-icons";
import { NO_WORDS_HEARD } from "./insufficient-copy";

interface Props {
  // What Otto heard or read; null when no words came through.
  text: string | null;
}

// The person's side of the chat, right-aligned like a sent message.
export function YourMessage({ text }: Props) {
  const { t } = useTranslation();
  return (
    <div className="flex w-full flex-col items-end gap-1">
      <Text variant="eyebrow" tone="muted" as="span">
        {t("You", "你")}
      </Text>
      <div className="max-w-[82%] rounded-2xl rounded-br-md border border-separator bg-surface px-3.5 py-2 text-left shadow-sm">
        {text ? (
          <Text
            variant="body-md"
            tone="body"
            className="line-clamp-3 break-words"
          >
            {text}
          </Text>
        ) : (
          <Text
            variant="body-md"
            tone="muted"
            italic
            className="flex items-center gap-2"
          >
            <Icon icon={MicOff01Icon} size={16} />
            {t(NO_WORDS_HEARD, "未识别到语音内容")}
          </Text>
        )}
      </div>
    </div>
  );
}
