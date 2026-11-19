import { Text } from "@/components/atoms/Text/Text";
import { useTranslation } from "@/lib/i18n/LanguageProvider";
import type { ImportMessage } from "../validation";

export function Transcript({ messages }: { messages: ImportMessage[] }) {
  const { t } = useTranslation();
  return (
    <ol
      className="max-h-96 space-y-3 overflow-auto rounded-md border border-border-base p-3"
      tabIndex={0}
      aria-label={t("Transcript", "对话记录")}
    >
      {messages.map((message, index) => (
        <li
          key={index}
          className="space-y-1 border-b border-border-base pb-3 last:border-0 last:pb-0"
        >
          <Text variant="small-semibold" tone="secondary">
            {message.role === "user"
              ? t("User", "用户")
              : t("Assistant", "助手")}
          </Text>
          <Text
            variant="body"
            className="break-words whitespace-pre-wrap"
            dir="auto"
          >
            {message.text}
          </Text>
        </li>
      ))}
    </ol>
  );
}
