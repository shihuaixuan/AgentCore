"use client";
import { useTranslation } from "@/lib/i18n/LanguageProvider";

import { SkillVersionSummary } from "@/app/api/__generated__/models/skillVersionSummary";
import { Button } from "@/components/atoms/Button/Button";
import { Text } from "@/components/atoms/Text/Text";
import {
  canRestore,
  getLearningLabel,
  versionLabel,
} from "@/services/skill-learning/helpers";
import { formatDistanceToNow } from "date-fns";
import { zhCN } from "date-fns/locale";

interface Props {
  versions: SkillVersionSummary[];
  currentVersionId: string | null;
  isBusy: boolean;
  onRestore: (versionId: string) => void;
  onSelect: (versionId: string) => void;
}

export function HistoryView({
  versions,
  currentVersionId,
  isBusy,
  onRestore,
  onSelect,
}: Props) {
  const { locale, t } = useTranslation();
  return (
    <div
      data-slot="skill-learning-sheet-history"
      className="flex flex-col gap-3"
    >
      <Text variant="small" tone="muted">
        {t(
          "Restoring affects future use only and cannot undo actions already taken. The current version stays in history.",
          "恢复仅影响以后的使用，无法撤销已执行的操作。当前版本会保留在历史记录中。",
        )}
      </Text>
      <ul
        data-slot="skill-learning-sheet-history-list"
        className="flex flex-col gap-2"
        aria-label={t("Version history", "版本历史")}
      >
        {versions.map((version) => {
          const restorable = canRestore(version, currentVersionId);
          return (
            <li
              key={version.id}
              data-slot="skill-learning-sheet-history-item"
              className="flex flex-col gap-1 rounded-lg bg-surface-muted p-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <div
                data-slot="skill-learning-sheet-history-item-info"
                className="min-w-0"
              >
                <Text variant="small-medium" tone="primary">
                  {versionLabel(version, locale)}
                  {version.id === currentVersionId
                    ? t(" · current", " · 当前版本")
                    : ""}
                </Text>
                <Text variant="small" tone="muted">
                  {getLearningLabel(version.state_label, locale)} ·{" "}
                  {formatDistanceToNow(new Date(version.created_at), {
                    addSuffix: true,
                    locale: locale === "zh-CN" ? zhCN : undefined,
                  })}
                  {version.summary ? ` · ${version.summary}` : ""}
                </Text>
              </div>
              <div
                data-slot="skill-learning-sheet-history-item-actions"
                className="flex shrink-0 gap-2"
              >
                <Button
                  variant="ghost"
                  size="small"
                  onClick={() => onSelect(version.id)}
                >
                  {t("View", "查看")}
                </Button>
                {restorable ? (
                  <Button
                    variant="secondary"
                    size="small"
                    disabled={isBusy}
                    onClick={() => onRestore(version.id)}
                    aria-label={t(
                      `Restore v${version.version}`,
                      `恢复 v${version.version}`,
                    )}
                  >
                    {t("Restore", "恢复")}
                  </Button>
                ) : null}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
