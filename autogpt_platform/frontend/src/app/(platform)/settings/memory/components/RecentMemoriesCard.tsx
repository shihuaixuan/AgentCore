"use client";

import { useTranslation } from "@/lib/i18n/LanguageProvider";
import type { MemoryFact } from "@/app/api/__generated__/models/memoryFact";
import { Button } from "@/components/atoms/Button/Button";
import { Skeleton } from "@/components/atoms/Skeleton/Skeleton";
import { Text } from "@/components/atoms/Text/Text";
import { formatWhen } from "../helpers";

interface Props {
  facts: MemoryFact[];
  isLoading: boolean;
  forgettingUuid: string | null;
  onForget: (uuid: string) => void;
  onForgetTopic: () => void;
}

export function RecentMemoriesCard({
  facts,
  isLoading,
  forgettingUuid,
  onForget,
  onForgetTopic,
}: Props) {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col rounded-large border border-border-base bg-surface px-4 py-4 shadow-message-table">
      <Text variant="body-medium" as="span">
        {t("Recent memories", "最近记忆")}
      </Text>
      <Text variant="small" as="span" tone="muted">
        {t(
          "The latest things this memory has learned. Forget any of them.",
          "这里显示最近学到的内容，你可以忘记其中任意一项。",
        )}
      </Text>

      <div className="mt-2 flex flex-col divide-y divide-separator">
        {isLoading ? (
          <div className="flex flex-col gap-2 py-3">
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-5 w-2/3" />
            <Skeleton className="h-5 w-4/5" />
          </div>
        ) : facts.length === 0 ? (
          <Text variant="small" as="p" tone="muted" className="my-3">
            {t(
              "Nothing remembered yet. Memories show up here as you chat.",
              "暂无记忆。聊天过程中形成的记忆会显示在这里。",
            )}
          </Text>
        ) : (
          facts.map((fact) => (
            <div
              key={fact.uuid}
              className="flex items-center justify-between gap-3 py-2.5"
            >
              <Text variant="small" as="span" className="min-w-0 flex-1">
                {fact.fact || `${fact.source} → ${fact.target}`}
              </Text>
              <Text
                variant="small"
                as="span"
                tone="subtle"
                className="hidden shrink-0 sm:inline"
              >
                {formatWhen(fact.created_at)}
              </Text>
              <Button
                variant="ghost"
                size="row"
                tone="secondary"
                className="h-7 shrink-0"
                loading={forgettingUuid === fact.uuid}
                onClick={() => onForget(fact.uuid)}
              >
                {t("Forget", "忘记")}
              </Button>
            </div>
          ))
        )}
      </div>

      <div className="mt-3">
        <Button variant="secondary" size="small" onClick={onForgetTopic}>
          {t("Forget a topic…", "忘记一个主题…")}
        </Button>
      </div>
    </div>
  );
}
