"use client";

import { useTranslation } from "@/lib/i18n/LanguageProvider";
import { ErrorCard } from "@/components/molecules/ErrorCard/ErrorCard";
import { Text } from "@/components/atoms/Text/Text";

import { BotCard } from "../BotCard/BotCard";
import { useBotsList } from "./useBotsList";

export function BotsList() {
  const { t } = useTranslation();
  const { platforms, isLoading, isError, error, refetch, isEmpty } =
    useBotsList();

  if (isLoading) {
    return (
      <div className="flex w-full flex-col gap-3 px-4">
        <div className="h-40 animate-pulse rounded-large bg-surface-hover" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex w-full flex-col gap-3 px-4">
        <ErrorCard
          context={t("bots", "机器人")}
          responseError={
            error instanceof Error ? { message: error.message } : undefined
          }
          onRetry={() => refetch()}
        />
      </div>
    );
  }

  if (isEmpty) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 px-6 py-10 text-center">
        <Text variant="large-medium" as="span">
          {t("No bots enabled", "尚未启用机器人")}
        </Text>
        <Text variant="body" tone="muted" className="max-w-[360px]">
          {t(
            "No chat-bot platforms are available on this deployment right now.",
            "当前部署暂无可用的聊天机器人平台。",
          )}
        </Text>
      </div>
    );
  }

  return (
    <div className="grid w-full grid-cols-1 items-start gap-4 px-4 pb-4 lg:grid-cols-2">
      {platforms.map((platform) => (
        <BotCard key={platform.platform} platform={platform} />
      ))}
    </div>
  );
}
