"use client";

import { useTranslation } from "@/lib/i18n/LanguageProvider";
import React from "react";
import { Input } from "@/components/atoms/Input/Input";
import { Select } from "@/components/atoms/Select/Select";

export function CustomInterval({
  value,
  onChange,
}: {
  value: { value: number; unit: "minutes" | "hours" | "days" };
  onChange: (v: { value: number; unit: "minutes" | "hours" | "days" }) => void;
}) {
  const { t } = useTranslation();
  return (
    <div className="flex items-end gap-3">
      <Input
        id="custom-interval-value"
        label={t("Every", "每隔")}
        type="number"
        min={1}
        value={value.value}
        onChange={(e) =>
          onChange({ ...value, value: parseInt(e.target.value || "1") })
        }
        className="max-w-24"
        size="small"
      />
      <Select
        id="custom-interval-unit"
        label={t("Interval", "间隔")}
        size="small"
        value={value.unit}
        onValueChange={(v) => onChange({ ...value, unit: v as any })}
        options={[
          { label: t("Minutes", "分钟"), value: "minutes" },
          { label: t("Hours", "小时"), value: "hours" },
          { label: t("Days", "天"), value: "days" },
        ]}
        className="max-w-40"
      />
    </div>
  );
}
