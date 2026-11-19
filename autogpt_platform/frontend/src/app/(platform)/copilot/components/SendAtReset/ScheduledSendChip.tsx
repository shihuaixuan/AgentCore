"use client";

import { useReadEveryRender } from "@/hooks/useReadEveryRender";
import type { AtResetTurn } from "@/app/api/__generated__/models/atResetTurn";
import { Button } from "@/components/atoms/Button/Button";
import { Icon } from "@/components/atoms/Icon/Icon";
import { Text } from "@/components/atoms/Text/Text";
import { Clock01Icon } from "@hugeicons/core-free-icons";
import { scheduledSendLabel } from "./helpers";
import { useScheduledSendDue } from "./useScheduledSendDue";
import { useTranslation } from "@/lib/i18n/LanguageProvider";

interface Props {
  job: AtResetTurn;
  onEdit: () => void;
  onCancel: () => void;
  isBusy?: boolean;
}

export function ScheduledSendChip({ job, onEdit, onCancel, isBusy }: Props) {
  const { t, locale } = useTranslation();
  // Once due it may already have gone: editing it then could send it twice.
  const isDue = useScheduledSendDue(job.run_at);
  // Its wording turns on the day, so read on every render rather than cached.
  const label = useReadEveryRender(() =>
    scheduledSendLabel(job.run_at, new Date(), locale),
  );
  return (
    <div
      role="status"
      aria-label={t("Scheduled message", "定时消息")}
      className="mb-2 flex items-center justify-between gap-3 rounded-2xl border border-brand/50 bg-accent-surface px-3 py-2"
    >
      <div className="flex min-w-0 items-center gap-2">
        <Icon
          icon={Clock01Icon}
          size={16}
          tone="brand-strong"
          className="shrink-0"
        />
        <Text variant="small-medium" tone="accent" className="shrink-0">
          {isDue ? t("Sending…", "正在发送…") : label}
        </Text>
        {job.message && (
          <Text tone="muted" variant="small" className="min-w-0 truncate">
            {job.message}
          </Text>
        )}
      </div>
      {!isDue && (
        <div className="flex shrink-0 items-center gap-1">
          <Button size="xs" variant="ghost" onClick={onEdit} disabled={isBusy}>
            {t("Edit", "编辑")}
          </Button>
          <Button
            size="xs"
            variant="ghost"
            onClick={onCancel}
            disabled={isBusy}
          >
            {t("Cancel", "取消")}
          </Button>
        </div>
      )}
    </div>
  );
}
