"use client";

import { useTranslation } from "@/lib/i18n/LanguageProvider";
import { Text } from "@/components/atoms/Text/Text";

export function BotsHeader() {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col items-start gap-4 pb-6 pl-4 sm:flex-row sm:items-start sm:justify-between">
      <div className="flex min-w-0 flex-col">
        <Text variant="h4" as="h1" tone="primary">
          {t("Bots", "机器人")}
        </Text>
        <Text variant="body" tone="secondary" className="mt-4 max-w-[600px]">
          {t(
            "Connect AutoGPT bots to your chat platforms. Add a bot to one of your servers, link a DM channel so the bot can talk to you directly, or unlink an existing connection.",
            "将 AutoGPT 机器人连接到您的聊天平台。将机器人添加到服务器，关联私信频道以便机器人直接与您交流，或解除现有连接。",
          )}
        </Text>
      </div>
    </div>
  );
}
