"use client";

import { useTranslation } from "@/lib/i18n/LanguageProvider";
import type { SkillVersionFileSummary } from "@/app/api/__generated__/models/skillVersionFileSummary";
import { Text } from "@/components/atoms/Text/Text";

interface Props {
  file?: SkillVersionFileSummary;
  label: string;
}

export function FilePreview({ file, label }: Props) {
  const { t } = useTranslation();
  if (!file) return null;
  return (
    <div data-slot="skill-learning-sheet-file-preview" className="min-w-0">
      <Text variant="small" tone="secondary">
        {t(
          `${label} · ${file.size_bytes.toLocaleString()} bytes`,
          `${label} · ${file.size_bytes.toLocaleString()} 字节`,
        )}
        {file.is_executable ? t(" · Executable", " · 可执行文件") : ""}
      </Text>
      {file.content != null ? (
        <pre
          data-slot="skill-learning-sheet-file-preview-content"
          className="mt-1 max-h-80 overflow-auto rounded-md bg-action-hover p-3 text-caption break-words whitespace-pre-wrap text-action-foreground"
        >
          {file.content ||
            (file.content_truncated
              ? t("(preview unavailable)", "（无法预览）")
              : t("(empty file)", "（空文件）"))}
        </pre>
      ) : (
        <Text variant="small" tone="muted">
          {t("Binary file", "二进制文件")}
        </Text>
      )}
      {file.content_truncated ? (
        <Text variant="small" tone="muted">
          {t(
            "Preview truncated; the complete file is retained in this version.",
            "预览已截断；此版本仍保留完整文件。",
          )}
        </Text>
      ) : null}
    </div>
  );
}
