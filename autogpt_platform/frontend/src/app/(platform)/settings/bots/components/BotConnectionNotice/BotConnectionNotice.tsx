"use client";

import Link from "next/link";
import { useTranslation } from "@/lib/i18n/LanguageProvider";

import { useGetV2ListChatTransports } from "@/app/api/__generated__/endpoints/chat/chat";
import { Text } from "@/components/atoms/Text/Text";

/**
 * A conversation that arrives over a bot link has no picker in front of it, so
 * the connection it starts on is whatever was chosen in Settings. That is the
 * least discoverable consequence of the setting — say it here, where someone
 * is looking at their bots.
 */
export function BotConnectionNotice() {
  const { t } = useTranslation();
  const transportsQuery = useGetV2ListChatTransports();
  const transports =
    transportsQuery.data?.status === 200
      ? transportsQuery.data.data.transports
      : [];
  const current = transports.find((transport) => transport.default);

  if (!current || transports.filter((t) => t.available).length < 2) return null;

  return (
    <div className="mb-6 ml-4 rounded-2xl border border-border-base bg-surface px-4 py-3">
      <Text variant="small" tone="body">
        {t(
          `Conversations that come in over a bot start on ${current.label}, the connection you chose in AI subscriptions.`,
          `通过机器人发起的对话将使用 ${current.label}，这是你在 AI 订阅设置中选择的连接。`,
        )}{" "}
        <Link
          href="/settings/integrations"
          className="font-medium text-brand underline underline-offset-2"
        >
          {t("AI subscriptions", "AI 订阅")}
        </Link>
      </Text>
    </div>
  );
}
