"use client";

import { useTranslation } from "@/lib/i18n/LanguageProvider";
import { formatWhen } from "@/app/(platform)/settings/memory/helpers";
import type { MemoryFact } from "@/app/api/__generated__/models/memoryFact";
import { Button } from "@/components/atoms/Button/Button";
import { Link } from "@/components/atoms/Link/Link";
import { Skeleton } from "@/components/atoms/Skeleton/Skeleton";
import { Text } from "@/components/atoms/Text/Text";
import { SoulSectionTitle } from "../../SoulSectionTitle";
import { useLearnedNotes } from "./useLearnedNotes";

interface Props {
  expertId: string;
}

export function LearnedNotes({ expertId }: Props) {
  const { t } = useTranslation();
  const { facts, isLoading, isError, forget, forgettingUuid } =
    useLearnedNotes(expertId);

  return (
    <section className="mb-8">
      <SoulSectionTitle>
        {t("What I've learned", "我学到的内容")}
      </SoulSectionTitle>
      {isLoading ? (
        <NotesSkeleton />
      ) : isError ? (
        <Text variant="small" tone="muted">
          {t(
            "Couldn't load what this expert has learned.",
            "无法加载这位专家学到的内容。",
          )}
        </Text>
      ) : facts.length === 0 ? (
        <Text variant="small" tone="muted">
          {t(
            "Nothing recorded yet. What this expert learns will appear here.",
            "暂无记录。这位专家学到的内容会显示在这里。",
          )}
        </Text>
      ) : (
        <NotesList
          expertId={expertId}
          facts={facts}
          forgettingUuid={forgettingUuid}
          onForget={forget}
        />
      )}
    </section>
  );
}

interface NotesListProps {
  expertId: string;
  facts: MemoryFact[];
  forgettingUuid: string | null;
  onForget: (uuid: string) => void;
}

function NotesList({
  expertId,
  facts,
  forgettingUuid,
  onForget,
}: NotesListProps) {
  const { t } = useTranslation();
  return (
    <>
      <Text variant="small" tone="muted">
        {t(
          "Picked up from your conversations. Forget anything that shouldn't stick.",
          "这些内容来自你们的对话。你可以让专家忘记不应保留的内容。",
        )}
      </Text>
      <div className="mt-2 flex flex-col divide-y divide-separator">
        {facts.map((fact) => (
          <div
            key={fact.uuid}
            className="flex items-start justify-between gap-2 py-2.5"
          >
            <div className="min-w-0 flex-1">
              <Text variant="small" as="p">
                {fact.fact || `${fact.source} → ${fact.target}`}
              </Text>
              <Text variant="small" as="span" tone="subtle">
                {formatWhen(fact.created_at)}
              </Text>
            </div>
            <Button
              type="button"
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
        ))}
      </div>
      <Link
        href={`/settings/memory?expert=${encodeURIComponent(expertId)}`}
        variant="secondary"
        // oxlint-disable-next-line design-system/no-restyle -- Link has no secondary-colour tone (src/components is P9's)
        className="mt-3 inline-block text-foreground-secondary"
      >
        {t("See all in memory settings", "在记忆设置中查看全部")}
      </Link>
    </>
  );
}

function NotesSkeleton() {
  return (
    <div className="mt-2 flex flex-col gap-2 py-1">
      <Skeleton className="h-5 w-3/4" />
      <Skeleton className="h-5 w-2/3" />
    </div>
  );
}
