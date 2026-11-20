import { Text } from "@/components/atoms/Text/Text";
import {
  Message,
  MessageContent,
} from "@/components/organisms/Message/Message";
import { useTranslation } from "@/lib/i18n/LanguageProvider";
import { ImportedChatText } from "@/app/(platform)/copilot/components/ImportedChatText";
import type { ImportMessage } from "../validation";

export function ArchiveChatTranscript({
  messages,
}: {
  messages: ImportMessage[];
}) {
  const { t } = useTranslation();
  return (
    <ol
      className="max-h-[32rem] min-h-40 space-y-5 overflow-y-auto px-4 py-5 sm:px-6"
      tabIndex={0}
      aria-label={t("Transcript", "对话记录")}
    >
      {messages.map(({ text, role }, index) => (
        <li key={index}>
          <Message from={role} className="min-w-0">
            <Text
              variant="small-semibold"
              tone="secondary"
              align={role === "user" ? "right" : "left"}
            >
              {role === "user" ? t("You", "你") : t("Assistant", "助手")}
            </Text>
            <MessageContent>
              <ImportedChatText text={text} role={role} />
            </MessageContent>
          </Message>
        </li>
      ))}
    </ol>
  );
}
