"use client";
import { useTranslation } from "@/lib/i18n/LanguageProvider";

import { SkillVersionSummary } from "@/app/api/__generated__/models/skillVersionSummary";
import { Button } from "@/components/atoms/Button/Button";
import { Text } from "@/components/atoms/Text/Text";
import Link from "next/link";

interface Props {
  version: SkillVersionSummary | null;
  isBusy: boolean;
  onExclude: (sourceKind: string, sourceRef: string) => void;
}

export function SourcesView({ version, isBusy, onExclude }: Props) {
  const { t } = useTranslation();
  const sources = version?.sources ?? [];
  if (!version || sources.length === 0) {
    return (
      <Text variant="small" tone="muted">
        {t("No sources are attached to this version.", "此版本没有关联来源。")}
      </Text>
    );
  }
  return (
    <ul
      data-slot="skill-learning-sheet-sources"
      className="flex flex-col gap-3"
      aria-label={t("Sources", "来源")}
    >
      {sources.map((source) => (
        <li
          key={source.source_id}
          data-slot="skill-learning-sheet-sources-item"
          className="rounded-lg bg-surface-muted p-3"
        >
          {source.accessible ? (
            <>
              <Text variant="small-medium" tone="primary">
                {source.title || t("Conversation", "对话")}
              </Text>
              <Text variant="small" tone="muted">
                {t("Revision", "修订版本")}
                {source.revision.replace(/^0+/, "") || "0"}
                {source.excluded
                  ? t(" · Excluded from learning", " · 已从学习中排除")
                  : ""}
              </Text>
              <div
                data-slot="skill-learning-sheet-sources-item-actions"
                className="mt-2 flex flex-wrap gap-2"
              >
                {source.url ? (
                  <Link
                    href={source.url}
                    target="_blank"
                    rel="noreferrer"
                    data-slot="skill-learning-sheet-sources-item-link"
                    className="text-body text-accent-strong underline"
                  >
                    {t("Open source", "打开来源")}
                  </Link>
                ) : null}
                {!source.excluded && source.source_ref ? (
                  <Button
                    variant="ghost"
                    size="small"
                    disabled={isBusy}
                    onClick={() =>
                      onExclude(source.source_kind, source.source_ref ?? "")
                    }
                  >
                    {t(
                      "Exclude this source from learning",
                      "从学习中排除此来源",
                    )}
                  </Button>
                ) : null}
              </div>
            </>
          ) : (
            <Text variant="small" tone="muted">
              {t("Evidence not visible to you", "你无权查看的依据")}
            </Text>
          )}
        </li>
      ))}
    </ul>
  );
}
