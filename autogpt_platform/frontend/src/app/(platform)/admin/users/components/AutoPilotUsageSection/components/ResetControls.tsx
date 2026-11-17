"use client";

import { Select } from "@/components/atoms/Select/Select";
import { useState } from "react";
import { RESET_SCOPE_OPTIONS, type ResetScope } from "../helpers";
import { ResetUsageDialog } from "./ResetUsageDialog";
import { useTranslation } from "@/lib/i18n/LanguageProvider";

interface Props {
  dailyUsed: number;
  weeklyUsed: number;
  isResetting: boolean;
  onReset: (scope: ResetScope, onSuccess: () => void) => void;
}

export function ResetControls({
  dailyUsed,
  weeklyUsed,
  isResetting,
  onReset,
}: Props) {
  const { t } = useTranslation();
  const [scope, setScope] = useState<ResetScope>("daily");

  return (
    <div className="flex flex-wrap items-center justify-end gap-2">
      <Select
        id="reset-scope"
        label={t("What to reset", "重置范围")}
        hideLabel
        size="small"
        value={scope}
        onValueChange={(value) => setScope(value as ResetScope)}
        options={RESET_SCOPE_OPTIONS.map(({ value, label }) => ({
          value,
          label: t(label, value === "daily" ? "每日使用量" : "每日和每周使用量"),
        }))}
        wrapperClassName="mb-0 w-[220px]"
      />
      <ResetUsageDialog
        scope={scope}
        nothingToReset={
          dailyUsed === 0 && (scope === "daily" || weeklyUsed === 0)
        }
        isResetting={isResetting}
        onConfirm={onReset}
      />
    </div>
  );
}
