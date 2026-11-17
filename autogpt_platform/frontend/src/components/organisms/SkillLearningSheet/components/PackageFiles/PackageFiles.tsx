"use client";

import { useTranslation } from "@/lib/i18n/LanguageProvider";
import type { SkillVersionFileSummary } from "@/app/api/__generated__/models/skillVersionFileSummary";
import { Text } from "@/components/atoms/Text/Text";
import { FilePreview } from "./FilePreview";
import { packageFileChanges } from "./helpers";

interface Props {
  before?: SkillVersionFileSummary[] | null;
  after?: SkillVersionFileSummary[] | null;
}

export function PackageFiles({ before, after }: Props) {
  const { t } = useTranslation();
  const changes = packageFileChanges(before, after);
  if (changes.length === 0) return null;
  return (
    <section
      aria-label={t("Package file changes", "软件包文件变更")}
      data-slot="skill-learning-sheet-package-files"
      className="flex min-w-0 flex-col gap-2"
    >
      <Text variant="small-medium">
        {t("Package file changes", "软件包文件变更")}
      </Text>
      {changes.map((change) => (
        <details
          key={change.path}
          data-slot="skill-learning-sheet-package-files-item"
          className="min-w-0 rounded-lg border border-border-base p-3"
        >
          <summary
            data-slot="skill-learning-sheet-package-files-item-summary"
            className="cursor-pointer text-body break-all"
          >
            <span data-slot="skill-learning-sheet-package-files-item-path">
              {change.path}
            </span>
            {" · "}
            {!change.after
              ? t("Removed", "已移除")
              : change.before
                ? t("Updated", "已更新")
                : t("Added", "已添加")}
          </summary>
          <div
            data-slot="skill-learning-sheet-package-files-item-previews"
            className="mt-3 flex min-w-0 flex-col gap-3"
          >
            <FilePreview
              file={change.before}
              label={t("Previous file", "原文件")}
            />
            <FilePreview file={change.after} label={t("New file", "新文件")} />
          </div>
        </details>
      ))}
    </section>
  );
}
