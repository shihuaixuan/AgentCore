"use client";
import { useTranslation } from "@/lib/i18n/LanguageProvider";

import { SkillVersionSummary } from "@/app/api/__generated__/models/skillVersionSummary";
import { Button } from "@/components/atoms/Button/Button";
import { Text } from "@/components/atoms/Text/Text";
import { lineDiff, stepChanges } from "@/services/skill-learning/helpers";
import { useState } from "react";
import { PackageFiles } from "./PackageFiles/PackageFiles";

interface Props {
  version: SkillVersionSummary | null;
  versions: SkillVersionSummary[];
  onSelect: (versionId: string) => void;
}

export function ChangesView({ version, versions, onSelect }: Props) {
  const { t } = useTranslation();
  const [showRaw, setShowRaw] = useState(false);
  if (!version) {
    return (
      <Text variant="small" tone="muted">
        {t("Nothing to compare yet.", "暂无可比较的内容。")}
      </Text>
    );
  }
  const base = versions.find((item) => item.id === version.base_version_id);
  const before = base?.body ?? "";
  const after = version.body ?? "";
  const changes = stepChanges(before, after);
  return (
    <div
      data-slot="skill-learning-sheet-changes"
      className="flex flex-col gap-4"
    >
      <label
        data-slot="skill-learning-sheet-changes-version-field"
        className="flex flex-col gap-1"
      >
        <Text variant="small-medium" tone="primary">
          {t("Version", "版本")}
        </Text>
        <select
          data-slot="skill-learning-sheet-changes-version-picker"
          className="rounded-md border border-border-base px-2 py-1 text-body"
          value={version.id}
          onChange={(event) => onSelect(event.target.value)}
          aria-label={t("Choose a version", "选择版本")}
        >
          {versions.map((item) => (
            <option
              key={item.id}
              data-slot="skill-learning-sheet-changes-version-option"
              value={item.id}
            >
              v{item.version} · {item.origin_label} · {item.state_label}
            </option>
          ))}
        </select>
      </label>
      <Text variant="small" tone="secondary">
        {base
          ? t(`Compared with v${base.version}`, `与 v${base.version} 比较`)
          : t(
              "First version — nothing to compare with",
              "首个版本，没有可比较的内容",
            )}
      </Text>
      {changes.length === 0 ? (
        <Text variant="small" tone="muted">
          {t("No step changed in this version.", "此版本没有步骤变更。")}
        </Text>
      ) : (
        <ul
          data-slot="skill-learning-sheet-changes-list"
          className="flex flex-col gap-3"
          aria-label={t("Changes by step", "按步骤查看变更")}
        >
          {changes.map((change) => (
            <li
              key={change.step}
              data-slot="skill-learning-sheet-changes-item"
              className="rounded-lg bg-surface-muted p-3"
            >
              <Text variant="small-medium" tone="primary">
                {change.step}
              </Text>
              {change.before ? (
                <Text variant="small" tone="muted" decoration="line-through">
                  {change.before}
                </Text>
              ) : null}
              {change.after ? (
                <Text variant="small" tone="primary">
                  {change.after}
                </Text>
              ) : (
                <Text variant="small" tone="danger">
                  {t("Removed", "已移除")}
                </Text>
              )}
            </li>
          ))}
        </ul>
      )}
      <Button variant="ghost" size="small" onClick={() => setShowRaw(!showRaw)}>
        {showRaw
          ? t("Hide raw diff", "隐藏原始差异")
          : t("Show raw Markdown diff", "显示原始 Markdown 差异")}
      </Button>
      <PackageFiles before={base?.files} after={version.files} />
      {showRaw ? (
        <pre
          data-slot="skill-learning-sheet-changes-raw-diff"
          className="overflow-x-auto rounded-lg bg-action-hover p-3 text-caption text-action-foreground"
        >
          {lineDiff(before, after) ||
            t("(no line-level differences)", "（无行级差异）")}
        </pre>
      ) : null}
    </div>
  );
}
