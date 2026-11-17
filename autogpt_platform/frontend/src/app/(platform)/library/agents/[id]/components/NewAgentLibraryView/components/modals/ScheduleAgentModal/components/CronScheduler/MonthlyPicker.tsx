"use client";

import { useTranslation } from "@/lib/i18n/LanguageProvider";
import React from "react";
import { Text } from "@/components/atoms/Text/Text";
import { MultiToggle } from "@/components/molecules/MultiToggle/MultiToggle";

export function MonthlyPicker({
  values,
  onChange,
}: {
  values: number[];
  onChange: (v: number[]) => void;
}) {
  const { t } = useTranslation();
  function allDays() {
    onChange(Array.from({ length: 31 }, (_, i) => i + 1));
  }
  function customize() {
    onChange([]);
  }
  const items = Array.from({ length: 31 }, (_, i) => ({
    value: String(i + 1),
    label: String(i + 1),
  }));
  const selected = values.map((v) => String(v));

  return (
    <div className="mb-6 space-y-2">
      <Text variant="body-medium" as="span">
        {t("Days of Month", "每月日期")}
      </Text>
      <div className="flex gap-2">
        <button
          type="button"
          className="h-[2.25rem] rounded-full border border-foreground-body px-4 py-2 text-body leading-4 font-medium text-foreground-base hover:bg-surface-hover"
          onClick={allDays}
        >
          {t("All Days", "每天")}
        </button>
        <button
          type="button"
          className="h-[2.25rem] rounded-full border border-foreground-body px-4 py-2 text-body leading-4 font-medium text-foreground-base hover:bg-surface-hover"
          onClick={customize}
        >
          Customize
        </button>
        <button
          type="button"
          className="h-[2.25rem] rounded-full border border-foreground-body px-4 py-2 text-body leading-4 font-medium text-foreground-base hover:bg-surface-hover"
          onClick={() => onChange([15])}
        >
          15th
        </button>
        <button
          type="button"
          className="h-[2.25rem] rounded-full border border-foreground-body px-4 py-2 text-body leading-4 font-medium text-foreground-base hover:bg-surface-hover"
          onClick={() => onChange([31])}
        >
          {t("Last Day", "最后一天")}
        </button>
      </div>

      {values.length < 31 && (
        <MultiToggle
          items={items}
          selectedValues={selected}
          onChange={(sv) => onChange(sv.map((s) => parseInt(s)))}
          aria-label={t("Select days of month", "选择每月日期")}
        />
      )}
    </div>
  );
}
