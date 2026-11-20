"use client";

import { AUTOPILOT_NAME } from "@/lib/branding";
import type { Expert } from "@/app/api/__generated__/models/expert";
import { Select } from "@/components/atoms/Select/Select";
import { AUTOPILOT_MEMORY_SCOPE } from "./useMemoryScope";
import { useTranslation } from "@/lib/i18n/LanguageProvider";
import { getExpertDisplayTitle } from "@/services/experts/expert-role-label";

interface Props {
  value: string;
  onValueChange: (value: string) => void;
  experts: Expert[];
  loading: boolean;
  error: unknown;
}

export function MemoryScopeSelector({
  value,
  onValueChange,
  experts,
  loading,
  error,
}: Props) {
  const { t, locale } = useTranslation();
  const expertOptions = experts.map((expert) => ({
    value: expert.id,
    label: getExpertDisplayTitle(expert, locale),
  }));
  const labelCounts = new Map<string, number>();
  for (const { label } of expertOptions) {
    labelCounts.set(label, (labelCounts.get(label) ?? 0) + 1);
  }
  const options = [
    {
      value: AUTOPILOT_MEMORY_SCOPE,
      label: t(`${AUTOPILOT_NAME} (account memory)`, `${AUTOPILOT_NAME}（账户记忆）`),
    },
    ...expertOptions.map(({ value, label }) => ({
      value,
      label: (labelCounts.get(label) ?? 0) > 1 ? `${label} (${value})` : label,
    })),
  ];

  return (
    <div className="flex flex-col gap-2 rounded-md border bg-surface p-3 sm:flex-row sm:items-end sm:justify-between">
      <div className="w-full sm:max-w-sm">
        <Select
          id="memory-scope"
          label={t("Memory scope", "记忆范围")}
          value={value}
          onValueChange={onValueChange}
          options={options}
          size="small"
          disabled={loading}
        />
      </div>
      <div aria-live="polite" className="flex flex-col gap-1 text-caption">
        {loading ? (
          <p className="text-foreground-tertiary">
            {t("Loading experts…", "正在加载专家…")}
          </p>
        ) : null}
        {value !== AUTOPILOT_MEMORY_SCOPE ? (
          <p className="text-foreground-tertiary">
            {t("Expert memory is read-only.", "专家记忆为只读。")}
          </p>
        ) : null}
        {error ? (
          <p className="text-error-foreground">
            {t("Failed to load experts.", "无法加载专家。")}
          </p>
        ) : null}
        {!loading && !error && experts.length === 0 ? (
          <p className="text-foreground-tertiary">
            {t("No experts for this account.", "此账户没有专家。")}
          </p>
        ) : null}
      </div>
    </div>
  );
}
