"use client";

import { Input } from "@/components/atoms/Input/Input";
import { Select } from "@/components/atoms/Select/Select";
import { Text } from "@/components/atoms/Text/Text";
import { useTranslation } from "@/lib/i18n/LanguageProvider";
import {
  BAN_DURATIONS,
  type BanDuration,
  formatDateTime,
  formatTimeUntil,
  getBanEnd,
} from "../../helpers";

interface Props {
  idPrefix: string;
  reason: string;
  onReasonChange: (reason: string) => void;
  duration: BanDuration;
  onDurationChange: (duration: BanDuration) => void;
}

export function ReasonFields({
  idPrefix,
  reason,
  onReasonChange,
  duration,
  onDurationChange,
}: Props) {
  const { t } = useTranslation();
  const end = getBanEnd(duration);
  const durationOptions = BAN_DURATIONS.map(({ value, label }) => ({
    value,
    label: t(
      label,
      { Permanent: "永久", "1 hour": "1 小时", "1 day": "1 天", "7 days": "7 天", "30 days": "30 天" }[label] ?? label,
    ),
  }));

  return (
    <>
      <Input
        id={`${idPrefix}-reason`}
        label={t("Reason (required)", "原因（必填）")}
        type="textarea"
        rows={3}
        placeholder={t("What they did", "违规行为说明")}
        value={reason}
        onChange={(event) => onReasonChange(event.target.value)}
        required
        wrapperClassName="mb-0"
      />
      <div className="flex flex-col gap-1">
        <Select
          id={`${idPrefix}-duration`}
          label={t("Duration", "时长")}
          value={duration}
          onValueChange={(value) => onDurationChange(value as BanDuration)}
          options={durationOptions}
          wrapperClassName="mb-0"
        />
        <Text variant="small" tone="muted">
          {end
            ? t("Ends", "结束时间") + ` ${formatDateTime(end)}（${formatTimeUntil(end)}）`
            : t("Doesn't end on its own.", "不会自动结束。")}
        </Text>
      </div>
    </>
  );
}
