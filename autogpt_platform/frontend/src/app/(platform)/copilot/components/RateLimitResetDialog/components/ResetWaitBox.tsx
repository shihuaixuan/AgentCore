"use client";

import { useTranslation } from "@/lib/i18n/LanguageProvider";

import { Button } from "@/components/atoms/Button/Button";
import { UsageMeters } from "@/components/organisms/UsageExperience/UsageMeters";
import { SEND_AT_RESET_LABEL } from "../../SendAtReset/helpers";

interface Reading {
  percent_used: number;
}

interface Props {
  meters?: { daily?: Reading | null; weekly?: Reading | null } | null;
  onSendAtReset?: () => void;
  isScheduling?: boolean;
}

export function ResetWaitBox({ meters, onSendAtReset, isScheduling }: Props) {
  const { t } = useTranslation();
  return (
    <div className="mb-5 space-y-4 rounded-xl border border-border-base bg-surface-muted p-4">
      <UsageMeters daily={meters?.daily} weekly={meters?.weekly} />
      {onSendAtReset && (
        <Button
          size="small"
          className="w-full"
          onClick={onSendAtReset}
          loading={isScheduling}
        >
          {t(SEND_AT_RESET_LABEL, "额度重置时发送")}
        </Button>
      )}
    </div>
  );
}
