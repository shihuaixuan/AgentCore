"use client";

import { useTranslation } from "@/lib/i18n/LanguageProvider";
import React from "react";
import { Select } from "@/components/atoms/Select/Select";

type CronFrequency =
  | "hourly"
  | "daily"
  | "weekly"
  | "monthly"
  | "yearly"
  | "custom"
  | "every minute";

export function FrequencySelect({
  value,
  onChange,
  selectedMinute,
  onMinuteChange,
}: {
  value: CronFrequency;
  onChange: (v: CronFrequency) => void;
  selectedMinute: string;
  onMinuteChange: (v: string) => void;
}) {
  const { t } = useTranslation();
  return (
    <>
      <Select
        id="repeat"
        label={t("Repeats", "重复")}
        size="small"
        value={value}
        onValueChange={(v) => onChange(v as CronFrequency)}
        options={[
          { label: t("Every Hour", "每小时"), value: "hourly" },
          { label: t("Daily", "每天"), value: "daily" },
          { label: t("Weekly", "每周"), value: "weekly" },
          { label: t("Monthly", "每月"), value: "monthly" },
          { label: t("Yearly", "每年"), value: "yearly" },
          { label: t("Custom", "自定义"), value: "custom" },
        ]}
        className="max-w-80"
      />
      {value === "hourly" && (
        <Select
          id="at-minute"
          label={t("At minute", "在第几分钟")}
          size="small"
          value={selectedMinute}
          onValueChange={(v) => onMinuteChange(v)}
          options={["0", "15", "30", "45"].map((m) => ({ label: m, value: m }))}
          className="max-w-32"
        />
      )}
    </>
  );
}
