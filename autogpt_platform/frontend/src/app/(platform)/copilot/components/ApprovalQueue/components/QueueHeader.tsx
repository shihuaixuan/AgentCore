import { Button } from "@/components/atoms/Button/Button";
import { approveAllLabel, modeLabel } from "../helpers";
import { Text } from "@/components/atoms/Text/Text";
import { useTranslation } from "@/lib/i18n/LanguageProvider";

interface Props {
  count: number;
  mode: string | null;
  approveAll: { count: number; busy: boolean; onClick: () => void } | null;
  onReviewAll: (() => void) | null;
  // Collapsed after Close and continue: the header alone, and a way back.
  onShow: (() => void) | null;
}

export function QueueHeader({
  count,
  mode,
  approveAll,
  onReviewAll,
  onShow,
}: Props) {
  const { t, locale } = useTranslation();
  return (
    <div className="flex min-h-11 flex-wrap items-center justify-between gap-x-3 gap-y-2 border-b border-separator bg-surface-muted/60 px-4 py-2">
      <span className="flex items-baseline gap-2 text-body font-medium text-foreground-strong">
        {t("Waiting for you", "等待你处理")}
        <span className="text-foreground-tertiary tabular-nums">{count}</span>
      </span>
      <div className="flex items-center gap-3">
        {modeLabel(mode, locale) && (
          <Text variant="small-tight" as="span" tone="muted">
            {modeLabel(mode, locale)}
          </Text>
        )}
        {onShow ? (
          <Button
            type="button"
            size="small"
            variant="secondary"
            className="min-w-0"
            aria-label={t("Show waiting cards", "显示待处理卡片")}
            aria-expanded={false}
            // Close and continue removed the button that had focus.
            autoFocus
            onClick={onShow}
          >
            {t("Show", "显示")}
          </Button>
        ) : (
          <>
            {onReviewAll && (
              <Button
                type="button"
                size="small"
                variant="secondary"
                className="min-w-0"
                onClick={onReviewAll}
              >
                {t("Review all", "审核全部")}
              </Button>
            )}
            {approveAll && (
              <Button
                size="small"
                variant="secondary"
                className="min-w-0"
                disabled={approveAll.busy}
                onClick={approveAll.onClick}
              >
                {approveAllLabel(approveAll.count, locale)}
              </Button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
