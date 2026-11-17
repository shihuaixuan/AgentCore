"use client";

import { useTranslation } from "@/lib/i18n/LanguageProvider";

import { Text } from "@/components/atoms/Text/Text";
import { formatBytes } from "../usageHelpers";
import { useWorkspaceStorage } from "./useWorkspaceStorage";

export function StorageBar() {
  const { t } = useTranslation();
  const { data: storage } = useWorkspaceStorage();
  if (!storage || storage.limit_bytes <= 0) return null;

  const { used_bytes, limit_bytes, file_count } = storage;
  const percent = Math.min(100, Math.round((used_bytes / limit_bytes) * 100));
  const isHigh = percent >= 80;
  const percentLabel =
    used_bytes > 0 && percent === 0
      ? t("<1% used", "已用不足 1%")
      : t(`${percent}% used`, `已用 ${percent}%`);

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-baseline justify-between">
        <Text tone="body" variant="body-medium">
          {t("File storage", "文件存储")}
        </Text>
        <Text variant="body" tone="muted" tabular>
          {percentLabel}
        </Text>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-surface-active">
        <div
          role="progressbar"
          aria-label={t("File storage usage", "文件存储用量")}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={percent}
          className={`h-full rounded-full transition-[width] duration-300 ease-out ${
            isHigh ? "bg-orange" : "bg-info"
          }`}
          style={{ width: `${Math.max(used_bytes > 0 ? 1 : 0, percent)}%` }}
        />
      </div>
      <Text tone="subtle" variant="small">
        {t(
          `${formatBytes(used_bytes)} of ${formatBytes(limit_bytes)} · ${file_count} ${file_count === 1 ? "file" : "files"}`,
          `${formatBytes(used_bytes)} / ${formatBytes(limit_bytes)} · ${file_count} 个文件`,
        )}
      </Text>
    </div>
  );
}
